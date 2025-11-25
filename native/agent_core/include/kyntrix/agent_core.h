#pragma once

#include "config.h";
#include "event.h";

#ifdef __cplusplus
extern "C" {
#endif

void kyntrix_agent_init(const kyntrixAgentConfig* config);

void kyntrix_agent_record(const KyntrixEvent* ev);

void kyntrix_agent_flush(void);

void kyntrix_agent_shutdown(void);

#ifdef __cpluscplus
} 
#endif
