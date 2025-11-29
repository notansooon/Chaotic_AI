#pragma once
#include <stdio.h>
#include <stdarg.h>

void log_debug(const char* fmt, ...);
void log_info(const char* fmt, ...);
void log_error(const char* fmt, ...);