import jester, viewbase, store, json, httpcore

settings:
    bindAddr = "localhost"
    staticDir = "./static"

# setup()

routes: 
    get "/":
        resp pageBase("""
        <div id="zed"></div>
        <script src="/marked.min.js"></script>
        <script src="/marked.lith.js"></script>
        <script src="/zed.js"></script>
        """)
    
    get "/notes":
        resp(Http200, $(%*searchNotes("")), "application/json")

    # post "/notes/create":