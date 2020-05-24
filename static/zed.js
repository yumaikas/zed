c.ready(function(){

    var zedRoot = function() {
        return B.view(['State', 'zed'], function(x) {
            return [
                ["h2", "Zed Notes"],
                ['LITERAL', marked("# Test of rendering")]
            ];
        });
    };

    B.mount("#zed", zedRoot());
});