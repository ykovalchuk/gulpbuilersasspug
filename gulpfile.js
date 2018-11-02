var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    connect = require('gulp-connect'),
    plumber = require('gulp-plumber'),
    clean = require('gulp-clean'),
    replace = require('gulp-replace'),
    svgSprite = require('gulp-svg-sprite'),
    inject = require('gulp-inject'),
    htmlreplace = require('gulp-html-replace'),
    fs = require('fs');

var config = {
    transform: [],
    mode: {
        symbol: {
            dest: '.',
            bust: false,
            sprite: "sprite.svg",
        }
    },
    svg: {
        xmlDeclaration: false
    }
};

gulp.task('svg', function() {
    gulp.src('dist/img/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(replace('&gt;', '>'))
        .pipe(gulp.dest('dist/img/svgsprite/'));
});

gulp.task('build', ['concat', 'sass', 'connect', 'watch']);
gulp.task('production', ['getscript', 'sass-prod'])

gulp.task('getscript', function() {
    gulp.src(['./src/js/**/*.js']).pipe(gulp.dest('./dist/js/vendor/'));

    var checker = setInterval(function(){
        fs.stat('./dist/js/vendor',function(err,stat){
            if (err == null){
                console.log('replace scripts');
                var sources = gulp.src(['./dist/js/vendor/**/*.js'], {
                    read: false
                });
                gulp.src('./dist/*.html')
                    .pipe(inject(sources))
                    .pipe(htmlreplace({
                        'js': ''
                    }))
                    .pipe(replace('/dist/', ''))
                    .pipe(gulp.dest('./dist/'));
                gulp.src('./dist/css/style.css.map')
                    .pipe(clean());
                clearInterval(checker);
            } else{
                console.log('Wait for vendor folder, error code: '+err.code);
            }
        })
    },500)
})

gulp.task('sass', function() {
    gulp.src('./src/scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(plumber({
            // errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['./node_modules']
        }))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/css'));
});


gulp.task('sass-prod', function() {
    gulp.src('./src/scss/style.scss')
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('connect', function() {
    connect.server({
        port: 1337,
        root: 'dist',
        livereload: true
    });
});

gulp.task('reload', function() {
    gulp.src('./dist/css/*.css')
        .pipe(connect.reload());
});

gulp.task('concat', function() {
    gulp.src('./dist/js/vendor')
        .pipe(clean());
    return gulp.src(['./node_modules/jquery/dist/jquery.js','./node_modules/bootstrap/dist/js/bootstrap.bundle.js' ,'./src/js/lib/*.js'])
        .pipe(concat('libs.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('watch', function() {
    gulp.watch('src/scss/*.scss', ['sass']);
    gulp.watch('src/scss/*.sass', ['sass']);
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/scss/**/.sass', ['sass']);
    gulp.watch('src/js/lib/*.js',['concat']);
    gulp.watch('dist/img/svg/*.svg', ['svg'])
    gulp.watch(['dist/css/*.css','dist/*.html'], ['reload']);
});
