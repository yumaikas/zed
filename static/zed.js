c.ready(function(){

    B.trample = 0;
    window.flash = function flash(message, level) {
        B.do('flashMessage', 'show', message, level);
    };
    B.set(['State', 'zed', 'notes'], []);
    B.set(['State', 'zed', 'searchTerms'], localStorage.getItem("searchTerms") || "");

    c.ajax('GET', '/notes', '', '', function(err, resp) {
        if (err) {
            flash
        }

        B.do('set', ['State', 'zed', 'notes'], resp.body)
    });


    var zedRoot = function() {
        var styles = [
            [".block", {
                display: "block",
            }],
            ["h4.message", {
                "min-width": "50%",
                "padding": "8px",
                "border": "1px solid cyan",
                "border-radius": "5px",
            }],
            [".message div", {
                "margin-bottom": "10px",
            }],
            [".message.info", {
                "color": "blue"
            }],
            [".message.warning", {
                "color": "yellow"
            }],
            [".message.error", {
                "color": "red"
            }],
            ["#note-editor", {
                "min-height": "3em", "border": "2px inset"
            }],
            [".mdown *:first-child", { 
                "margin": "0px"
            }],
            [".mdown",  {
            }],
            [".tagline", {
            }],
            [".note", {
                "margin": "4px",
                "padding": "5px",
                "border": "1px dashed cyan",
                "border-radius": "3px"
            }]
        ];

        function loadFlash() {
            var flash = B.get(['State', 'zed', 'flash']);
            if (flash) {
                return [
                    ['h4', {class: "block message " + (flash.level || "info")},
                        [
                            ["div", flash.message],
                            ["a", B.ev(
                                    { href: "#", class: "center"}, 
                                    [["onclick", "flashMessage", "dismiss"]]
                            ), "Ok"]
                        ]
                    ],
                ];
            } else {
                return [];
            }
        }

        function labeledInput(name, id, attrs) {
            attrs.id = id;
            attrs.name = id;
            return [
                ["label", { class: "block", for: id}, name],
                ["input", attrs]
            ];
        }

        function searchbar() {
            var id = "searchbar";
            var name = "Search";

            var searchTerms = B.get(['State', 'zed', 'searchTerms']) || "";

            var evts = [
                ["onchange", "search", "*"],
                ["onkeyup", "search", "*"],
            ];

            console.log("SEARCH: " + searchTerms);
            return [
                ["label", { class: "block", for: id}, name],
                ["input", B.ev({id: id, name: id, type: "text", value: searchTerms}, evts)]
            ];
        }

        function editorArea(id) {
            // Content
            return [
                ["label", {for: "note-editor", class: "block"}, "Note:"],
                ['div', { id: "note-editor", contenteditable: "true", }] 
            ];
        }

        function button(name, attrs, evts) {
            return ["button", B.ev(attrs || {}, evts || undefined), name];
        }

        function filterTerms(search, notes){
            return dale.fil(notes, false, function(n){
                var corpus = n.content + " \n " + n.tagline + " \n@#"+n.id + " ";
                if (corpus.indexOf(search) !== -1) {
                    return n;
                }
                return false;
            });
        }

        var evts = [
            ["flashMessage", "show", function(x, message, level) {
                B.do('set', ['State', 'zed', 'flash'], {
                    message: message,
                    level: level
                });
            }],
            ['search', '*', {}, function() {
                console.log("searching");
                var terms = c("#searchbar").value;
                localStorage.setItem("searchTerms", terms);
                B.do('set', ['State', 'zed', 'searchTerms'], terms);
            }],
            ['flashMessage', 'dismiss', function() {
                B.do('set', ['State', 'zed', 'flash'], null);
            }],
            ['save', 'new-note', function(x) {
                var contentElem = c("#note-editor");
                var content = contentElem.innerText;
                var taglineElem = c("#tagline");
                var tagline = taglineElem.value;
                contentElem.innerText = "";

                B.do('ajax', 'createNote', tagline, content);
            }],
            ['change', ['State', 'zed'], { priority: -10000 }, function(x) {
                console.log("XEH: " + JSON.stringify(x.path));
                dale.do(
                    filterTerms(
                        B.get(['State', 'zed', 'searchTerms']) || "",
                        B.get(['State', 'zed', 'notes'])),
                    function(n) {
                        c("#md-container-" + n.id).innerHTML = marked(n.content);
                    }
                );
            }],
            ['ajax', 'createNote', function(x, tagline, content) {
                c.ajax('POST', '/notes/create', {}, 
                {
                    tagline: tagline, 
                    content: content,
                },
                function(err, resp) {
                    if (err) {
                        console.log(err);
                        flash("An error happened while", "error");
                        return;
                    }
                    var notes = B.get(['State', 'zed', 'notes']);
                    notes.unshift({
                        tagline: tagline,
                        content: content,
                        id: parseInt(resp.body, 10),
                    });
                    B.do('change', ['State', 'zed', 'notes']);
                    c("#note-editor").focus();
                })
            }],
        ];

        // Turn notes into subviews
        function renderNote(n, idx) {

            var evts = [
                ['noteEdit', ['notes', idx], function() {
                    B.set(['State', 'zed', 'activeEditNotes', idx], true);
                    B.do('change', ['State', 'zed', 'notes', idx]);
                }],
                ['noteSave', ['notes', idx], function() {
                    B.set(['State', 'zed', 'activeEditNotes', idx], false);
                    B.do('change', ['State', 'zed', 'notes', idx]);
                }],
            ];

            return B.view(['State', 'zed', 'notes', idx], 
                {
                    listen: evts,
                    tag:"div", 
                    attrs: {class:"note"}
                },
                function(x){
                    if (B.get('State', 'zed', 'activeEditNotes', idx)) {
                        return [
                            ["div", ""],
                            ["a", B.ev({href:"#"}, ['onclick', 'noteSave', ['notes', idx]]), "Save"]
                        ];

                    }

                    return [
                        ['div', {opaque:true, class: "mdown", id: "md-container-" + n.id}],
                        ['hr'],
                        ['div', {class: "tagline"}, [
                            ["a", B.ev({href: "#"}, ['onclick','noteEdit',['notes', idx]]), "Edit"],
                            ["span", {style: "margin-left 5px"}, " #" + n.id],
                            ["span", " " + n.tagline]
                        ]]
                    ];
                }
            );
        }

        return B.view(['State', 'zed'], 
            {listen: evts},
            function(x) {
                var loadedNotes = B.get(['State', 'zed', 'notes'], ) || [];
                var searchTerms = B.get(['State', 'zed', 'searchTerms']) || "";
                var l = [
                    ['style', styles],
                    ["h2", "Zed Notes"],
                    loadFlash(),
                    searchbar(),
                    editorArea("#note-editor"),
                    labeledInput("Tag-line", "tagline", {type:"text"}),
                    button("Save", {}, ["onclick", "save", "new-note"]),
                    dale.do(filterTerms(searchTerms, loadedNotes).slice(0, 10), function(n, idx) {
                        return renderNote(n, idx);
                    })
                ];
                return l;
        });
    };

    B.mount("#zed", zedRoot());
});