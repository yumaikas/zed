import norm/sqlite, times, options, json
import webconfig

db(DB_FILE, "", "", ""):
    type
        Note* = object
            content*: string
            tagline*: string
            created*: DateTime
            updated*: Option[DateTime]
            deleted*: Option[DateTime]

        NoteHistory* = object
            noteId*: int
            content*: string
            tagline*: string
            created*: DateTime
            updated*: Option[DateTime]
            deleted*: Option[DateTime]
        
proc setup*() = 
    withDb:
       createTables(force=true)

proc `%`*(t: DateTime): JsonNode =
    return %(t.toTime().toUnix())


proc searchNotes*(searchTerms: string): seq[Note] =
    withDb:
        return Note.getAll(cond="""
            (content like '%' || ? || '%'
            OR tagline like '%' || ? || '%')
            AND content not like '@archive'
            AND tagline not like '@archive'
            ORDER BY created desc
        """, params=[?searchTerms, ?searchTerms])

when isMainModule:
    setup()