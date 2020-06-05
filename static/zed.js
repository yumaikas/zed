
c.ready(function(){
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    B.trample = 50;
    window.flash = function flash(message, level) {
        B.do('flashMessage', 'show', message, level);
    };
    B.set(['State', 'zed', 'notes'], []);
    B.set(['State', 'zed', 'searchTerms'], localStorage.getItem("searchTerms") || "");

    c.ajax('GET', '/notes', '', '', function(err, resp) {
        if (err) {
            flash("An error happened trying to load notes.", "error");
            return;
        }
        B.do('set', ['State', 'zed', 'notes'], dale.do(resp.body,function(n){
            n.rendered = marked(n.content);
            return n;
        }));
    });


    var zedRoot = function() {
        var styles = [
            [".block", {
                display: "block",
            }],
            [".hrefbtn", {
                "border-radius": "3px",
                "border": "1px solid cyan",
                "padding": "3px",
                "margin-right": "6px",
            }],
            [".rlmargin", {
                "margin-left": "0.3em",
                "margin-right": "0.3em"
            }],
            ["#searchbar, #tagline", {
                "border": "2px inset",
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
            [".note-editor", {
                "min-height": "3em", "border": "2px inset"
            }],
            ["pre.note-editor", {
                "overflow-x": "auto",
                "white-space": "pre-wrap",
            }],
            [".mdown *:first-child", { 
                "margin": "0px"
            }],
            [".mdown",  {
            }],
            [".tagbottom", {
                "margin-bottom": "40px"
            }],
            [".note", {
                "margin": "4px",
                "margin-top": "20px",
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

        function labeledInput(name, id, attrs, evts) {
            attrs.id = id;
            attrs.name = id;
            return [
                ["label", { class: "block", for: id}, name],
                ["input", B.ev(attrs, evts || [])]
            ];
        }

        function searchbar() {
            var id = "searchbar";
            var name = "Search";

            var searchTerms = B.get(['State', 'zed', 'searchTerms']) || "";

            var evts = [
                ["onkeyup", "search", "*"],
                ["onfocus", "setTagFocus", "to", "searchBar"]
            ];

            return [
                ["label", { class: "block", for: id}, name],
                ["input", B.ev({id: id, name: id, type: "text", value: searchTerms}, evts)]
            ];
        }

        function editorArea(id, text) {
            // Content
            return [
                ["label", {for: id, class: "block"}, "Note:"],
                ['pre', { class: "note-editor", id: id, contenteditable: "true", }, text || ""] 
            ];
        }

        function button(name, attrs, evts) {
            return ["button", B.ev(attrs || {}, evts || undefined), name];
        }

        // Turn notes into subviews
        function renderNote(n, idx) {
            function renderTagbar(n) {
                var tags = n.tagline.split(" ");
                return dale.do(tags, function(t) {
                    if (/^#\d+$/.test(t) || /@[^ ]+/.test(t)) {
                        return ["a", B.ev({href: "#", class: "rlmargin"}, ["onclick", 'noteAddTag', ['notes', idx], t]), t];
                    } else {
                        return " " + t + " ";
                    }
                });
            }
            var noteEvts = [
                ['noteEdit', ['notes', idx], function() {
                    B.set(['State', 'zed', 'activeEditNotes', idx], true);
                    B.do('change', ['State', 'zed', 'notes', idx]);
                }],
                ['noteAddTag', ['notes', idx], function(x, newTag) {
                    var tl = c("#tagline");
                    var search = c("#searchbar");
                    var tagFocus = B.get(["State", "zed", "tagFocus"]);
                    console.log(tagFocus)
                    if (tagFocus === "searchBar") {
                        search.value = (search.value + " " + newTag).trim();
                    } else {
                        tl.value = (tl.value + " " + newTag).trim();
                    }
                    B.do('search', '*');
                }],
                ['noteSave', ['notes', idx], function() {
                    var content = c("#note-editor-" + idx).innerText;
                    var tagline = c("#note-tagbar-" + idx).value;
                    B.do('ajax', ['updateNote', idx], content, tagline);
                }],
                ['todoDone', ['todos', idx], function() {
                    B.do('ajax', ['updateNote', idx], n.content, n.tagline.replace(/@todo\b/g, ""))
                }],
                ['ajax', ['updateNote', idx], function(x, content, tagline) {
                    var body = {
                        id: n.id,
                        content: content,
                        tagline: tagline,
                    };
                    c.ajax('POST', '/notes/update', {}, body, function(err, resp) {
                        if (err) {
                            console.log(err);
                            flash("An error happened while trying to save a note!", "error");
                        } else {
                            n.tagline = tagline;
                            n.content = content;
                            n.rendered = marked(content);
                            B.set(['State', 'zed', 'activeEditNotes', idx], false);
                            B.do('change', ['State', 'zed', 'notes', idx]);
                        }
                    });
                }],
            ];

            return B.view(['State', 'zed', 'notes', idx], 
                {
                    listen: noteEvts,
                    tag:"div", 
                    attrs: {class:"note"}
                },
                function(x){

                    var doneView = [];
                    if (/@todo/.test(n.tagline)) {
                        var doneView = [
                            ["a", B.ev({href: "#", class: "hrefbtn"}, 
                            [["onclick", 'todoDone', ['todos', idx]]]
                        ), "Finish!"],
                        ["br"],
                        ["br"]
                    ];
                    }

                    if (B.get('State', 'zed', 'activeEditNotes', idx)) {
                        return [
                            ["div", ""],
                            editorArea("note-editor-" + idx, n.content),
                            ["input", {id: "note-tagbar-" + idx, value: n.tagline, size: n.tagline.length}],
                            ["a", B.ev({href:"#"}, ['onclick', 'noteSave', ['notes', idx]]), "Save"]
                        ];
                    }

                    return [
                        ['div', {opaque:true, class: "mdown", class: "md-container-" + n.id}],
                        ['hr'],
                        ['div', {class: "tagline"}, [
                            ["a", B.ev({href: "#", class: "hrefbtn"}, ['onclick','noteEdit',['notes', idx]]), "Edit"],
                            doneView,
                            ["a", B.ev({href:"#", style: "margin-left: 15px"}, ["onclick", "noteAddTag", ["notes", idx], "#" + n.id]), "#" + n.id],
                            renderTagbar(n),
                        ]]
                    ];
                }
            );
        }

        function filterTerms(search, notes){
            var numExtra = B.get(['State', 'zed', 'addedNotes']) || 0;
            var terms = dale.fil((search || "").split(","), false,function(x) {
                var reverse = false;
                // Keep trailing commas from matching _everything_
                if (x.trim() === "")  return false;
                if (x.indexOf("!desc") !== -1) {
                    x = x.replace("!desc", "")
                    reverse = true;
                }
                return { term: x.trim(), results: [], reverse: reverse };
            });

            if (terms.length === 0)  {
                return notes;
            }

            for (var i = 0; i < notes.length; i++) {
                var n = notes[i];
                var corpus =  "@#" + n.id + " " + n.tagline + " \n " + n.content;
                for (var j = 0; j < terms.length; j++) {
                    if (corpus.indexOf(terms[j].term) !== -1) {
                        terms[j].results.push(n);
                    }
                }
            }

            var l = dale.acc(terms, [], function(acc, x) {
                if (x.reverse) {x.results.reverse();}
                return acc.concat(x.results); 
            });

            if (l.length > (7 + numExtra)) {
                B.set(['State', 'zed', 'showMore'], true);
            }

            return l.slice(0, 7 + numExtra);
        }

        var doSearch = debounce(function() {
            B.do('change', ['State', 'zed']);
        }, 350);

        var zedEvts = [
            ["flashMessage", "show", function(x, message, level) {
                B.do('set', ['State', 'zed', 'flash'], {
                    message: message,
                    level: level
                });
            }],
            ["showMore", "notes", function(x) {
                var addedNotes = B.get(['State', 'zed', 'addedNotes']) || 0;
                B.do('set', ['State', 'zed', 'addedNotes'], addedNotes + 7);
                B.do('change', ['State', 'zed']);
            }],
            ["setTagFocus", "to", function(x, target) {
                B.do('set', ['State', 'zed', 'tagFocus'], target);
            }],
            ['search', '*', {}, function() {
                var terms = c("#searchbar").value;
                B.set(['State', 'zed', 'showMore'], false);
                B.set(['State', 'zed', 'searchTerms'], terms);
                localStorage.setItem("searchTerms", terms);
                doSearch();
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
                // console.log("XEH: " + JSON.stringify(x.path));
                dale.do(
                    filterTerms(
                        B.get(['State', 'zed', 'searchTerms']) || "",
                        B.get(['State', 'zed', 'notes'])),
                    function(n, idx) {
                        if (B.get(['State', 'zed', 'activeEditNotes', idx])) { return }

                        dale.do(c(".md-container-" + n.id), function(e) {
                            e.innerHTML = n.rendered;
                        });
                    }
                )
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
                        rendered: marked(content),
                        id: parseInt(resp.body, 10),
                    });
                    B.do('change', ['State', 'zed', 'notes']);
                    c("#note-editor").focus();
                })
            }],
        ];

        return B.view(['State', 'zed'], 
            {listen: zedEvts},
            function(x) {
                var loadedNotes = B.get(['State', 'zed', 'notes']) || [];
                var searchTerms = B.get(['State', 'zed', 'searchTerms']) || "";
                var terms = filterTerms(searchTerms, loadedNotes);
                var showMore = B.get(['State', 'zed', 'showMore']) || false;
                var showMoreDisp = [];
                if (showMore) {
                    showMoreDisp = ['a', B.ev({href: "#"}, [
                        ['onclick', 'showMore', 'notes']
                    ]), "Show more"];
                }
                var l = [
                    ['style', styles],
                    ["h2", "Zed Notes"],
                    loadFlash(),
                    searchbar(),
                    editorArea("note-editor"),
                    labeledInput("Tag-line", "tagline", {type:"text"}, 
                        ["onfocus", "setTagFocus", "to", "tagline"]),
                    button("Save", {}, ["onclick", "save", "new-note"]),
                    ["hr", {class: "tagbottom"}],
                    dale.do(terms, function(n, idx) {
                        return renderNote(n, idx);
                    }),
                    showMoreDisp
                ];
                return l;
        });
    };

    B.mount("#zed", zedRoot());
});