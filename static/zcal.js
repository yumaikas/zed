c.ready(function() {
    // TODO: Load in existing notes that have date info on them
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
        return B.view(['zcal', 'date'], function() {
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
                                console.log()
                                if (dtNow.getMonth() == date.month 
                                    && dtNow.getFullYear() == date.year 
                                    && monthDate == dtNow.getDate()
                                ) {
                                    return ['td', {style: "font-weight: bold; color: yellow"}, monthDate];
                                } else {
                                    return ['td', monthDate];
                                }
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
                    console.log("XEH");
                    var date = B.get(['zcal', 'date']);
                    date.month -= 1;
                    console.log(date);
                    date = wrapDate(date);
                    B.do('set', ['zcal', 'date'], date);
                    B.do('change', ['zcal', 'date']);
                }],
                ['prevMonth', ['*'], function() {
                    console.log("PEX");
                    var date = B.get(['zcal', 'date']);
                    date.month += 1;
                    console.log(date);
                    date = wrapDate(date);
                    B.do('set', ['zcal', 'date'], date);
                    B.do('change', ['zcal', 'date']);
                }]
            ]
        },
        function() {
            var monthIdx = B.get(['zcal', 'date', 'month']);
            var year = B.get(['zcal', 'date', 'year']);
            console.log(monthIdx);
            return [ 
                ['h3', [
                    ["a", B.ev({href:"#"}, ['onclick', 'nextMonth', '*']), "Prev"],
                    " " + months[monthIdx] + " - " + year + " ",
                    ["a", B.ev({href:"#"}, ['onclick', 'prevMonth', '*']), "Next"],
                ]],
                monthView(),
                renderNotes(),
            ];
        });
    }

    B.mount("#cal", pickerView());
});