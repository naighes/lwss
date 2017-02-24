var gulp = require("gulp");
var mocha = require("gulp-mocha");
var runSequence = require("run-sequence");

gulp.task("default", function(done) {
    runSequence("test", function() {
        done();
    });
});

gulp.task("test", function() {
    return gulp.src(["!node_modules",
        "!node_modules/**",
        "./cart/*.spec.js",
        "./lib/*.spec.js",
        "./listener/*.spec.js"])
        .pipe(mocha({ reporter: "nyan" }));
});
