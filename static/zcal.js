function notesToDateBoxes(notes) {
    var dateMap = {};

    dale.do(notes, function(n) {
        var parts = /@(\d+|\*)-(\d+|\*)-(\d+|\*)/.exec(n.tagline);
        if (!parts) return;
        dateMap[parts[1]] = dateMap[parts[1]] || {};
        dateMap[parts[1]][parts[2]] = dateMap[parts[1]][parts[2]] || {};
        dateMap[parts[1]][parts[2]][parts[3]] = dateMap[parts[1]][parts[2]][parts[3]] || [];
        dateMap[parts[1]][parts[2]][parts[3]].push(n);
    });

    return dateMap;
}
c.ready(function() {
    // TODO: Load in existing notes that have date info on them

    c.ajax('GET', '/notes', '', '', function(err, resp) {
        if (err) {
            flash("An error happened trying to load notes.", "error");
            return
        }

        var boxedNotes = notesToDateBoxes(dale.do(resp.body, function(n) {
            n.rendered = marked(n.content);
            return n;
        }));

        B.do('set', ['zcal', 'notes'], boxedNotes);
    });

    function notesForDate(date) {
        console.log(date);
        var notes = (B.get('zcal', 'notes') || {});
        console.log("notes:" + notes);
        var forYear = (notes[date.year] || {});
        console.log(forYear);
        var forMonth = (forYear[date.month + 1] || {});
        console.log("For month: " + forMonth);
        var forDay = forMonth[date.date] || [];
        console.log("For Day: " + forDay);

        return forDay;
    }

    window.flash = function flash(message, level) {
        B.do('flashMessage', 'show', message, level);
    };

    // TODO: Mark a given date as having events or not.
    var now = new Date();
    B.set(['zcal', 'date', 'month'], now.getMonth());
    B.set(['zcal', 'date', 'year'], now.getFullYear());

    var weekDays = [
        {name: "Sunday", suffix: "S"},
        {name: "Monday", suffix: "M"},
        {name: "Tuesday", suffix: "T"},
        {name: "Wednesday", suffix: "W"},
        {name: "Thursday", suffix: "R"},
        {name: "Friday", suffix: "F"},
        {name: "Saturday", suffix: "S"},
    ];

    var months = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec"
    ];

    var monthView = function() {
        return B.view(['zcal', 'date'], {
            listen: [["viewNotes", "*", function(x, date) {
                localStorage.setItem("one_time_search", "@" + date.year + "-" + date.month + "-" + date.date)
                window.location = "/"
            }]]
        }, function() {
            // A calendar is a 6x7 table
            var date = B.get(['zcal', 'date']);

            var dtInfo = new Date(date.year, date.month, 1);

            var firstDayOffset = dtInfo.getDay();

            var dtNow = new Date();

            var lastDay = new Date(date.year, date.month, 31).getDate();
            if (lastDay !== 31) { lastDay = 31 - lastDay; }

            dtInfo.getFullYear()
            var dtCounter = 0;
            return ['table', 
            [
                ['tr',
                    dale.do(weekDays, function(x) { 
                        return ['td', x.suffix];
                    })
                ]
            ].concat(
                dale.do(dale.times(6, 0), function() {
                    return ['tr', 
                        dale.do(weekDays, function() {
                            dtCounter++;
                            var monthDate = dtCounter - firstDayOffset;

                            if (monthDate> 0 && monthDate <= lastDay) {
                                var dayDate= {
                                    year: date.year,
                                    month: date.month + 1,
                                    date: monthDate
                                };
                                var notes = notesForDate({
                                    year: date.year,
                                    month: date.month,
                                    date: monthDate
                                });
                                console.log(notes);
                                var isCurrentDate = dtNow.getMonth() == date.month 
                                        && dtNow.getFullYear() == date.year 
                                        && monthDate == dtNow.getDate();
                                var dateDisp = notes.length > 0 ? monthDate + "*" : monthDate;
                                var attr = B.ev({"href": "#", class: (isCurrentDate ? "currDate": "")}, [["onclick", "viewNotes", ["*"], dayDate]])
                                var monthDisp = ["a", attr, dateDisp];
                                return ['td', [monthDisp]];
                            } else {
                                return ['td', '...'];
                            }
                        })
                    ];
                })
            )
            ];
        });
    };

    function wrapDate(_date) {
        var date = { month: _date.month, year: _date.year};
        if (date.month > 11) {
            date.month = 0;
            date.year += 1;
        }
        if (date.month < 0) {
            date.month = 11;
            date.year -= 1;
        }
        return date;
    }

    var pickerView = function() {
        return B.view(['zcal', 'date'], {
            listen: [
                ['nextMonth', ['*'], function() {
                    var date = B.get(['zcal', 'date']);
                    date.month -= 1;
                    date = wrapDate(date);
                    B.do('set', ['zcal', 'date'], date);
                    B.do('change', ['zcal', 'date']);
                }],
                ['prevMonth', ['*'], function() {
                    var date = B.get(['zcal', 'date']);
                    date.month += 1;
                    date = wrapDate(date);
                    B.do('set', ['zcal', 'date'], date);
                    B.do('change', ['zcal', 'date']);
                }],
            ]
        },
        function() {
            var monthIdx = B.get(['zcal', 'date', 'month']);
            var year = B.get(['zcal', 'date', 'year']);
            return [ 
                ['h3', [
                    ["a", B.ev({href:"#"}, ['onclick', 'nextMonth', '*']), "Prev"],
                    " " + months[monthIdx] + " - " + year + " ",
                    ["a", B.ev({href:"#"}, ['onclick', 'prevMonth', '*']), "Next"],
                ]],
                monthView(),
            ];
        });
    }

    var fullView = function() {
        return B.view(['zcal'], {
            listen: [
                ["flashMessage", "show", function(x, message, level) {
                    B.do('set', ['zcal', 'flash'], {
                        message: message,
                        level: level
                    });
                }],
                ["flashMessage", "dismiss", function() {
                    B.do('set', ['zcal', 'flash'], null);
                }]
            ]
        }, function() {
            var pickedDate = B.get('zcal', 'date');

            return [
                ["style", zStyles],
                ["h2", "Zed Planner"],
                pickerView()
            ];
        });
    }

    B.mount("#cal", fullView());
});