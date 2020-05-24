import norm/sqlite, times, options, json

db("zed.db", "", "", ""):
    type
        Note* = object
            content*: string
            created*: DateTime
            updated*: Option[DateTime]
            deleted*: Option[DateTime]

        NoteHistory = object
            noteId*: int
            content*: string
            created*: DateTime
            updated*: Option[DateTime]
            deleted*: Option[DateTime]
        
proc setup*() = 
    withDb:
        createTables()

proc `%`*(t: DateTime): JsonNode =
    return %(t.toTime().toUnix())


proc searchNotes*(searchTerms: string): seq[Note] =
    withDb:
        return Note.getAll(cond="""
            content like '%'  || ? || '%'
            AND content not like '@archive'
        """, params=[?searchTerms])
