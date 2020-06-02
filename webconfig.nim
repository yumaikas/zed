import os, strutils

proc envOrDefault(key, fallback: string): string = 
    result = getEnv(key)
    if not existsEnv(key):
        result = fallback

let PORT*: int = envOrDefault("PORT", "5050").parseInt
let THEME*: string = envOrDefault("THEME", "CYAN")
let DB_FILE*: string = envOrDefault("DB_FILE", "zed.db")
let BIND_LOCAL_ONLY*: bool = envOrDefault("BIND_LOCAL_ONLY", "true").toLowerAscii().parseBool()