#include "logging.h"

void log_debug(const char* fmt, ...) {

    va_list args;
    va_start(args, fmt);

    fprintf(stderr, "[DEBUG] ");
    vfprintf(stderr, fmt, args);
    fprintf(stderr, "\n");

    va_end(args);

}

void log_info(const char* fmt, ...) {

    va_list args;
    va_start(args, fmt);

    fprintf(stderr, "[INFO] ");
    vfprintf(stderr, fmt, args);
    fprintf(stderr, "\n");

    va_end(args);

}

void log_error(const char* fmt, ...) {

    va_list args;
    va_start(args, fmt);

    fprintf(stderr, "[ERROR] ");
    vfprintf(stderr, fmt, args);
    fprintf(stderr, "\n");

    va_end(args);

}