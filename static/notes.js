var zStyles = [
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
    function labeledInput(name, id, attrs, evts) {
        attrs.id = id;
        attrs.name = id;
        return [
            ["label", { class: "block", for: id}, name],
            ["input", B.ev(attrs, evts || [])]
        ];
    }
function renderNote(n, isEditNote, path, idx) {
    function renderTagbar(n) {
        var tags = n.tagline.split(" ");
        return dale.do(tags, function (t) {
            if (/^#\d+$/.test(t) || /@[^ ]+/.test(t)) {
                return ["a", B.ev({ href: "#", class: "rlmargin" }, ["onclick", 'noteAddTag', ['notes', idx], t]), t];
            } else {
                return " " + t + " ";
            }
        });
    }
    var noteEvts = [
        ['noteEdit', ['notes', idx], function () {
            B.set(['State', 'zed', 'activeEditNotes', idx], true);
            B.do('change', ['State', 'zed', 'notes', idx]);
        }],
        ['noteAddTag', ['notes', idx], function (x, newTag) {
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
        ['noteSave', ['notes', idx], function () {
            var content = c("#note-editor-" + idx).innerText;
            var tagline = c("#note-tagbar-" + idx).value;
            B.do('ajax', ['updateNote', idx], content, tagline);
        }],
        ['todoDone', ['todos', idx], function () {
            B.do('ajax', ['updateNote', idx], n.content, n.tagline.replace(/@todo\b/g, ""))
        }],
        ['ajax', ['updateNote', idx], function (x, content, tagline) {
            var body = {
                id: n.id,
                content: content,
                tagline: tagline,
            };
            c.ajax('POST', '/notes/update', {}, body, function (err, resp) {
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

    return B.view(path.concat(idx),
        {
            listen: noteEvts,
            tag: "div",
            attrs: { class: "note" }
        },
        function (x) {
            console.log("foo");

            var doneView = [];
            if (/@todo/.test(n.tagline)) {
                var doneView = [
                    ["a", B.ev({ href: "#", class: "hrefbtn" },
                        [["onclick", 'todoDone', ['todos', idx]]]
                    ), "Finish!"],
                    ["br"],
                    ["br"]
                ];
            }

            if (isEditNote) {
                return [
                    ["div", ""],
                    editorArea("note-editor-" + idx, n.content),
                    ["input", { id: "note-tagbar-" + idx, value: n.tagline, size: n.tagline.length }],
                    ["a", B.ev({ href: "#" }, ['onclick', 'noteSave', ['notes', idx]]), "Save"]
                ];
            }

            return [
                ['div', { opaque: true, class: "mdown", class: "md-container-" + n.id }],
                ['hr'],
                ['div', { class: "tagline" }, [
                    ["a", B.ev({ href: "#", class: "hrefbtn" }, ['onclick', 'noteEdit', ['notes', idx]]), "Edit"],
                    doneView,
                    ["a", B.ev({ href: "#", style: "margin-left: 15px" }, ["onclick", "noteAddTag", ["notes", idx], "#" + n.id]), "#" + n.id],
                    renderTagbar(n),
                ]]
            ];
        }
    );
}