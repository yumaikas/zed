import jester, viewbase, store, json, httpcore, times, norm/sqlite
from nativesockets import Port
import webconfig

var bindAddr = "localhost"

if not BIND_LOCAL_ONLY:
    bindAddr = "0.0.0.0"

settings:
    port = nativeSockets.Port(webconfig.PORT)
    bindAddr = bindAddr
    staticDir = "./static"

routes: 
    get "/":
        resp pageBase("""
        <div id="zed"></div>
        <script src="/marked.min.js"></script>
        <script src="/notes.js"></script>
        <script src="/zed.js"></script>
        """)

    get "/cal":
        resp pageBase("""
        <div id="cal"></div>
        <script src="/marked.min.js"></script>
        <script src="/notes.js"></script>
        <script src="/zcal.js"></script>
        """)
    
    get "/notes":
        resp(Http200, $(%*searchNotes("")), "application/json")

    post "/notes/create":
        let noteJson = parseJson(request.body)
        assert noteJson.hasKey("content"), "Note requires content!"
        assert noteJson.hasKey("tagline"), "Note requires tagline!"
        let content = noteJson{"content"}.getStr("")
        let tagline = noteJson{"tagline"}.getStr("")
        
        withDb:
            resp $(Note(
                content: content, 
                created: now().utc,
                tagline: tagline
            ).insertID())
    
    post "/notes/update":
        let noteJson = parseJson(request.body)
        assert noteJson.hasKey("content"), "Note requires content!"
        assert noteJson.hasKey("tagline"), "Note requires tagline!"
        assert noteJson.hasKey("id"), "Note requires ID to be updated!"

        let id = noteJson{"id"}.getInt(-1)
        assert id != -1, "Cannot update a note with an ID of -1"

        withDb:
            var note = Note.getOne(id)

            discard NoteHistory(
                noteId: id,
                content: note.content,
                tagline: note.tagline,
                created: note.created,
                updated: note.updated,
                deleted: note.deleted
            ).insertID()

            note.content = noteJson{"content"}.getStr("")
            note.tagline = noteJson{"tagline"}.getStr("")
            note.updated = some(now().utc)

            note.update()
            resp Http200, "Successfully saved!"


    

    
