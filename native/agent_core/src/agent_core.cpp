#include "kyntrix/agent_core.h"
#include "logging.h"

#include <vector>
#include <string>
#include <mutex>
#include <curl/curl.h>

// ---------- Internal types ----------

struct InternalEvent {
    std::string run_id;
    long long   seq;
    long long   ts;
    std::string kind;
    std::string span;
    std::string parent_span;
    std::string node_key;
    std::string data_json;
};

struct AgentState {
    bool initialized = false;

    std::string ingest_url;
    std::string default_run_id;
    int         batch_size = 50;

    std::vector<InternalEvent> buffer;
    std::mutex mutex;
};

static AgentState g_state;

// ---------- Helpers (internal) ----------

static std::string escape_json(const std::string& s) {
    std::string out;
    out.reserve(s.size() + 8);

    for (char c : s) {
        switch (c) {
        case '\"': out += "\\\""; break;
        case '\\': out += "\\\\"; break;
        case '\n': out += "\\n";  break;
        case '\r': out += "\\r";  break;
        case '\t': out += "\\t";  break;
        default:   out += c;
        }
    }
    return out;
}

static std::string to_ndjson(const std::vector<InternalEvent>& batch) {
    std::string ndjson;
    ndjson.reserve(batch.size() * 200); 

    for (const auto& e : batch) {
        ndjson += "{";

        ndjson += "\"runId\":\"" + escape_json(e.run_id) + "\",";
        ndjson += "\"seq\":" + std::to_string(e.seq) + ",";
        ndjson += "\"ts\":" + std::to_string(e.ts) + ",";
        ndjson += "\"kind\":\"" + escape_json(e.kind) + "\",";
        ndjson += "\"span\":";

        ndjson += e.span.empty() ? "null" : ("\"" + escape_json(e.span) + "\"");
        ndjson += ",";
        ndjson += "\"parentSpan\":";
        ndjson += e.parent_span.empty() ? "null" : ("\"" + escape_json(e.parent_span) + "\"");
        ndjson += ",";
        ndjson += "\"nodeKey\":";
        ndjson += e.node_key.empty() ? "null" : ("\"" + escape_json(e.node_key) + "\"");
        ndjson += ",";
        ndjson += "\"data\":";
        ndjson += e.data_json.empty() ? "null" : e.data_json;

        ndjson += "}\n";
    }

    return ndjson;
}

// HTTP POST implementation using libcurl
static bool http_post(const std::string& url, const std::string& body) {
    if (url.empty()) {
        log_error("[agent_core] http_post: empty URL");
        return false;
    }

    CURL* curl = curl_easy_init();
    if (!curl) {
        log_error("[agent_core] curl_easy_init failed");
        return false;
    }

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/x-ndjson");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, (long)body.size());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);  // 5 second timeout
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 2L);

    CURLcode res = curl_easy_perform(curl);

    bool success = (res == CURLE_OK);
    if (!success) {
        log_error("[agent_core] http_post failed: %s", curl_easy_strerror(res));
    } else {
        log_info("[agent_core] http_post success: %zu bytes to %s", body.size(), url.c_str());
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return success;
}

static void flush_locked() {
    if (!g_state.initialized) {
        return;
    }
    if (g_state.buffer.empty()) {
        return;
    }

    // Move buffer into a local batch and clear global buffer
    std::vector<InternalEvent> batch;
    batch.swap(g_state.buffer);

    std::string body = to_ndjson(batch);
    if (body.empty()) return;

    http_post(g_state.ingest_url, body);
}

// ---------- Public API ----------

extern "C" {

void kyntrix_agent_init(const KyntrixAgentConfig* cfg) {
    if (!cfg) {
        log_error("[agent_core] init called with null cfg");
        return;
    }

    if (g_state.initialized) {
        log_info("[agent_core] already initialized, skipping");
        return;
    }

    std::lock_guard<std::mutex> lock(g_state.mutex);

    g_state.ingest_url     = cfg->ingest_url ? cfg->ingest_url : "";
    g_state.default_run_id = cfg->run_id     ? cfg->run_id     : "";
    g_state.batch_size     = cfg->batch_size > 0 ? cfg->batch_size : 50;

    g_state.buffer.clear();
    g_state.buffer.reserve(g_state.batch_size * 2);
    g_state.initialized = true;

    log_info("[agent_core] initialized: url=%s batch=%d",
        g_state.ingest_url.c_str(), g_state.batch_size);
}

void kyntrix_agent_record(const KyntrixEvent* ev) {
    if (!ev) {
        return;

    } 

    std::lock_guard<std::mutex> lock(g_state.mutex);

    if (!g_state.initialized) {
        log_error("[agent_core] record before init");
        return;
    }


    // Load event into internal structure
    InternalEvent e;
    // run_id
    if (ev->run_id && ev->run_id[0] != '\0') {
        e.run_id = ev->run_id;
    } 
    else {
        e.run_id = g_state.default_run_id;
    }

    e.seq  = ev->seq;
    e.ts   = ev->ts;

    if (ev->kind) {
        e.kind = ev->kind;

    }        

    if (ev->span) {
        e.span = ev->span;
    }

    if (ev->parent_span) {
        e.parent_span = ev->parent_span;
    }
    if (ev->node_key) {
        e.node_key = ev->node_key;
    }

    if (ev->data_json) {
        e.data_json   = ev->data_json;
    }

    g_state.buffer.push_back(std::move(e));

    if ((int)g_state.buffer.size() >= g_state.batch_size) {
        flush_locked();
    }
}

void kyntrix_agent_flush(void) {
    std::lock_guard<std::mutex> lock(g_state.mutex);
    flush_locked();
}

void kyntrix_agent_shutdown(void) {
    std::lock_guard<std::mutex> lock(g_state.mutex);
    flush_locked();
    g_state.buffer.clear();
    g_state.initialized = false;
    log_info("[agent_core] shutdown complete");
}

} // extern "C"
