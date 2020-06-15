
c.ready(function(){

    window.flash = function flash(message, level) {
        B.do('flashMessage', 'show', message, level);
    };
    B.set(['State', 'zed', 'notes'], []);
    B.set(['State', 'zed', 'searchTerms'], localStorage.getItem("one_time_search") || localStorage.getItem("searchTerms") || "");

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

        function button(name, attrs, evts) {
            return ["button", B.ev(attrs || {}, evts || undefined), name];
        }

        // Turn notes into subviews
        function filterTerms(search, notes, numExtra){
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
                return {
                    notes: notes.slice(0, 7 + numExtra),
                    hasMore: notes.length > (7 + numExtra)
                };
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

            return {
                notes: l.slice(0, 7 + numExtra), 
                hasMore: l.length > (7 + numExtra),

            };
        }

        var doSearch = debounce(function() {
            var terms = c("#searchbar").value;
            B.set(['State', 'zed', 'showMore'], false);
            B.set(['State', 'zed', 'searchTerms'], terms);
            localStorage.setItem("searchTerms", terms);
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
                var fil = filterTerms(
                        B.get(['State', 'zed', 'searchTerms']) || "",
                        B.get(['State', 'zed', 'notes']));
                dale.do(fil.notes,
                    function(n, idx) {
                        if (B.get(['State', 'zed', 'activeEditNotes', idx])) { return }

                        dale.do(c(".md-container-" + n.id), function(e) {
                            e.innerHTML = n.rendered;
                        });
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
                var showMore = terms.hasMore;
                var showMoreDisp = [];
                if (showMore) {
                    showMoreDisp = ['a', B.ev({href: "#"}, [
                        ['onclick', 'showMore', 'notes']
                    ]), "Show more"];
                }
                var tagBar = localStorage.getItem("one_time_search") || (c("#tagline") || {}).value || "";
                console.log("Tagbar: " +tagBar);
                var l = [
                    ['style', zStyles],
                    ["h2", "Zed Notes"],
                    ["h3", ["a", {"href": "/cal"}, "Calendar"]],
                    loadFlash(),
                    searchbar(),
                    editorArea("note-editor"),
                    labeledInput("Tag-line", "tagline", {type:"text", value: tagBar}, 
                        ["onfocus", "setTagFocus", "to", "tagline"]),
                    button("Save", {}, ["onclick", "save", "new-note"]),
                    ["hr", {class: "tagbottom"}],
                    dale.do(terms.notes, function(n, idx) {
                        return renderNote(n, 
                                B.get(['State', 'zed', 'activeEditNotes', idx]),
                                ["State", "zed", "notes"],
                                idx);
                    }),
                    showMoreDisp
                ];
                if (localStorage.getItem("one_time_search")) {
                    localStorage.removeItem("one_time_search");
                }
                return l;
        });
    };

    B.mount("#zed", zedRoot());
});