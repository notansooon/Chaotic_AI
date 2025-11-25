#pragma once
#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char* run_id;
    long long seq;
    long long ts;
    const char* kind;
    const char* span;
    const char* parent_span;
    const char* node_key;
    const char* data_json;
} KyntrixEvent;


#ifdef __cplusplus
} 
#endif