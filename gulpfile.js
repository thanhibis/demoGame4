// ============================================================
// gulpfile.js - Gulp 4+ / ES Modules
// ============================================================

import gulp from 'gulp';
import htmlMin from 'gulp-htmlmin';
import prettify from 'gulp-prettify';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import ejs from 'gulp-ejs';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import imageMin from 'gulp-imagemin';
import mozJpeg from 'imagemin-mozjpeg';
import pngQuant from 'imagemin-pngquant';
import svgmin from 'gulp-svgmin';
import webp from 'gulp-webp';
import babel from 'gulp-babel';
import terser from 'gulp-terser';
import { readFile } from 'fs/promises';
import mergeStream from 'merge-stream';
import changed from 'gulp-changed';

const sass = gulpSass(dartSass);

// ============================================================
// Environment Configuration
// ============================================================
const isProd = process.env.NODE_ENV === 'production';
const baseDir = isProd ? './dist/' : './';

// ============================================================
// Paths Configuration
// ============================================================
const paths = {
    ejs: {
        dist: baseDir,
    },
    styles: {
        dist: `${baseDir}css/`,
    },
    scripts: {
        src: ['./src/js/**/*.js', '!./src/js/**/vendors/*.js'], // 外部のライブラリファイルはコンパイルしない
        copy: './src/js/**/vendors/**/*',
        dist: `${baseDir}js/`,
    },
    images: {
        src: './src/img/**/*.{jpg,jpeg,png,gif}',
        srcSvg: './src/img/**/*.svg',
        srcWebp: './src/img/**/*.{jpg,jpeg,png}',
        dist: `${baseDir}img/`,
        distWebp: `${baseDir}img/webp/`,
    },
    fonts: {
        src: './fonts/**/*.{off,ttf,woff,woff2}',
        dist: `${baseDir}fonts/`,
    },
};

// ============================================================
// Utility Functions for EJS Task
// ============================================================


const getRelativePath = (depth) => {
    const relativePaths = ['./', '../', '../../', '../../../', '../../../../'];
    return relativePaths[depth] || './';
};


const generateBreadcrumbs = (page, relativePath) => {
    const { bread1, bread2, bread3, bread4, bread1_url, bread2_url, bread3_url } = page;
    
    if (!bread1) return '';
    
    const crumbs = [`<span><a href="${relativePath}">ホーム</a></span>`];
    
    if (bread1) {
        crumbs.push(`<span>${bread1_url ? `<a href="${relativePath}${bread1_url}">${bread1}</a>` : bread1}</span>`);
    }
    if (bread2) {
        crumbs.push(`<span>${bread2_url ? `<a href="${relativePath}${bread2_url}">${bread2}</a>` : bread2}</span>`);
    }
    if (bread3) {
        crumbs.push(`<span>${bread3_url ? `<a href="${relativePath}${bread3_url}">${bread3}</a>` : bread3}</span>`);
    }
    if (bread4) {
        crumbs.push(`<span>${bread4}</span>`);
    }
    
    return crumbs.join(' ');
};

/**
 * 親ディレクトリのパスを構築
 * @param {object} page - ページデータ
 * @returns {string} - 親ディレクトリのパス
 */
const buildParentPath = (page) => {
    const { parentId1, parentId2, parentId3, parentId4 } = page;
    const parts = [parentId1, parentId2, parentId3, parentId4].filter(id => id !== '');
    return parts.join('/');
};

/**
 * 1つのページのHTMLを生成するGulpストリーム
 * @param {object} page - ページデータ
 * @param {string} templateFile - テンプレートファイルのパス
 * @returns {Stream} - Gulpストリーム
 */
const buildPageStream = (page, templateFile) => {
    const relativePath = getRelativePath(page.depth);
    const breadcrumbs = generateBreadcrumbs(page, relativePath);
    const parentPath = buildParentPath(page);
    
    return gulp
        .src(templateFile)
        .pipe(plumber({
            errorHandler: function(err) {
                this.emit('end');
            }
        }))
        .pipe(
            ejs({
                pageData: page,
                RELATIVE_PATH: relativePath,
                template: page.template,
                BREADCRUMBS: breadcrumbs,
            })
        )
        .pipe(rename(`${page.id}.html`))
        .pipe(
            isProd
                ? htmlMin({
                    removeComments: true,
                    collapseWhitespace: true,
                    collapseInlineTagWhitespace: true,
                    preserveLineBreaks: true,
                })
                : prettify({
                    indent_with_tabs: true,
                    indent_size: 4,
                })
        )
        .pipe(gulp.dest(paths.ejs.dist + parentPath));
};

// ============================================================
// EJS Task
// ============================================================
export const ejsTask = async () => {
    const templateFile = './ejs/template.ejs';
    const jsonFile = './ejs/data/pages.json';
    const jsonData = await readFile(jsonFile, 'utf-8');
    const json = JSON.parse(jsonData);
    const pageData = json.pages;
    
    const streams = pageData.map(page => buildPageStream(page, templateFile));
    return mergeStream(...streams);
};

// ============================================================
// Sass Task
// ============================================================
export const sassTask = () => {
    let stream = gulp
        .src([
            './scss/**/*.scss',
            '!./scss/**/_*.scss' // Exclude partials
        ])
        .pipe(plumber({
            errorHandler: function(err) {
                console.error('\n❌ SCSS Error:');
                console.error(err.messageFormatted || err.message);
                console.log('✅ Watching for changes... (fix the error and save again)\n');
                this.emit('end'); // Keep stream alive
            }
        }));
    
    if (!isProd) {
        stream = stream.pipe(sourcemaps.init());
    }
    
    stream = stream
        .pipe(
            sass({
                outputStyle: 'expanded',
            })
        );
    
    // ✅ PostCSS with autoprefixer and cssnano (browserslist is managed in package.json)
    const postcssPlugins = [autoprefixer()];
    if (isProd) {
        postcssPlugins.push(cssnano());
    }
    
    stream = stream.pipe(postcss(postcssPlugins));
    
    if (!isProd) {
        stream = stream.pipe(sourcemaps.write('./maps'));
    }
    
    return stream.pipe(gulp.dest(paths.styles.dist));
};

// ============================================================
// JavaScript Task
// ============================================================
export const jsTask = () => {
    // Compile and minify main scripts
    let compileStream = gulp
        .src(paths.scripts.src)
        .pipe(plumber({
            errorHandler: function(err) {
                console.error('\n❌ JavaScript Error:');
                console.error(err.message);
                console.log('✅ Watching for changes... (fix the error and save again)\n');
                this.emit('end');
            }
        }))
        .pipe(
            babel({
                presets: ['@babel/preset-env'], // ✅ browserslist は package.json で一元管理
            })
        );
    
    if (isProd) {
        compileStream = compileStream.pipe(terser()); // 圧縮
    }
    
    compileStream = compileStream.pipe(gulp.dest(paths.scripts.dist));
    
    // Copy vendor libraries without processing
    const copyVendors = gulp
        .src(paths.scripts.copy)
        .pipe(gulp.dest(paths.scripts.dist));
    
    return mergeStream(compileStream, copyVendors);
};

// ============================================================
// Image Optimization Task (JPG, PNG, GIF)
// ============================================================
export const imgTask = () => {
    console.log('🖼️  Optimizing images...');
    return gulp
        .src(paths.images.src, { encoding: false })
        .pipe(plumber())
        .pipe(changed(paths.images.dist)) // Skip unchanged files
        .pipe(
            imageMin([
                mozJpeg({ quality: 80 }),
                pngQuant({ quality: [0.6, 0.8] }),
            ])
        )
        .pipe(gulp.dest(paths.images.dist, { overwrite: true }));
};

// ============================================================
// SVG Optimization Task
// ============================================================
export const svgTask = () => {
    console.log('🎨 Optimizing SVG files...');
    let stream = gulp
        .src(paths.images.srcSvg)
        .pipe(plumber())
        .pipe(changed(paths.images.dist)); // Skip unchanged files
    
    if (isProd) {
        stream = stream.pipe(
            svgmin({
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                removeViewBox: false,
                                cleanupIDs: false,
                            },
                        },
                    },
                ],
            })
        );
    }
    
    return stream.pipe(gulp.dest(paths.images.dist, { overwrite: true }));
};

// ============================================================
// WebP Conversion Task
// ============================================================
export const webpTask = () => {
    console.log('🌐 Running WebP conversion...');
    return gulp
        .src(paths.images.srcWebp, { encoding: false })
        .pipe(plumber())
        .pipe(changed(paths.images.distWebp, { extension: '.webp' })) // Skip unchanged files
        .pipe(webp())
        .pipe(gulp.dest(paths.images.distWebp, { overwrite: true }));
};

// ============================================================
// Watch Task
// ============================================================
export const watchTask = () => {
    gulp.watch('./ejs/**/*.ejs', ejsTask);
    gulp.watch('./scss/**/*.scss', sassTask);
    // Watch main scripts and vendors separately
    gulp.watch(paths.scripts.src, gulp.series(jsTask));
    gulp.watch(paths.scripts.copy, gulp.series(() => {
        return gulp
            .src(paths.scripts.copy)
            .pipe(gulp.dest(paths.scripts.dist));
    }));
    // Skip heavy image processing during dev/watch for better performance
};

// ============================================================
// Images Task (Process images: optimize + svg, excluding webp)
// ============================================================
export const images = gulp.parallel(
    imgTask,
    svgTask
);

// ============================================================
// Images with WebP Task (Heavy task - run separately when needed)
// ============================================================
export const imagesWebp = gulp.series(
    images,
    webpTask
);

// ============================================================
// Development Task (Fast, no minification, with watch)
// ============================================================
export const dev = gulp.series(
    gulp.parallel(ejsTask, sassTask, jsTask),
    watchTask
);

// ============================================================
// Build Task (Full optimization with minification)
// Split into stages to reduce CPU/memory load
// ============================================================
export const build = gulp.series(
    // Stage 1: Code compilation (parallel)
    gulp.parallel(
        ejsTask,
        sassTask,
        jsTask
    ),
    // Stage 2: Image optimization (parallel)
    gulp.parallel(
        imgTask,
        svgTask
    )
);

// ============================================================
// Build with WebP (Full build + WebP conversion)
// ============================================================
export const buildWebp = gulp.series(
    build,
    webpTask
);

// ============================================================
// Export Tasks (Backward Compatible)
// ============================================================
export { ejsTask as ejs };
export { sassTask as sass };
export { jsTask as js };
export { imgTask as img };
export { svgTask as svg };
export { webpTask as webp };
export { watchTask as watch };

// ============================================================
// Default Task
// ============================================================
export default dev;
