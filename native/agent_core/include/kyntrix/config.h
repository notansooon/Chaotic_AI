#pragma once

#ifdef __cplusplus 
extern "C" {
#endif

typedef struct {
    const char* ingest_url;
    const char* run_id;
    int         batch_size;
    int         flush_interval_ms;
}   kyntrixAgentConfig;

#ifdef __cplusplus
} 
#endif