//menu header
$('.js-mobile').on('click', function () {
	$(this).toggleClass("js-mobile--close");
	$("html").toggleClass("js-locked");
	// $(".nav-menu").slideToggle();
	// e.preventDefault();
	$(".header-nav").fadeToggle();
});


$('.float-right__menu-option').on('click', function () {
	$(this).toggleClass("active");
	$(".float-right").toggleClass("active");
});


//backtop
jQuery(document).ready(function ($) {
	$(window).on("scroll", function () {
		if ($(window).scrollTop() > $("#footer").offset().top - $(window).outerHeight()) {
			$(".float-right").addClass("fixd");
		} else {
			$(".float-right").removeClass("fixd");
		}
	});
	$('.js-backtop').click(function () {
		$('body,html').animate({
			scrollTop: 0
		}, 500);
		return false;
	});
});


$('.class-gallery__for').slick({
	slidesToShow: 1,
	slidesToScroll: 1,
	arrows: true,
	fade: true,
	asNavFor: '.class-gallery__nav',
	infinite: true,
	adaptiveHeight: true
});
$('.class-gallery__nav').slick({
	slidesToShow: 10,
	slidesToScroll: 1,
	asNavFor: '.class-gallery__for',
	dots: false,
	focusOnSelect: true,
	infinite: true,
	arrows: false,
	responsive: [
		{
			breakpoint: 800,
			settings: {
				slidesToShow: 5,
				centerMode: true,
				centerPadding: 0,
			}
		}
	]
});

$(window).on('load ', function () {
	$(".class-gallery").each(function () {
		$(this).find('.class-gallery__nav--custom').append($(this).find('.slick-arrow'));
	});
	$(".class-gallery__for-ct").each(function () {
	
	});
});

$('.class-gallery__for-status li').on('click', function () {
	const index = $(this).index();
	
	$(this)
		.addClass('active')
		.siblings()
		.removeClass('active');
	
	const $tabWrap = $(this)
		.closest('.class-gallery__for-ct')
		.find('.class-gallery__for-tab');
	
	$tabWrap.find('li')
		.removeClass('active')
		.eq(index)
		.addClass('active');
	
});



$('.video-list').slick({
    dots: true,
    focusOnSelect: true,
    pauseOnHover:false,
    infinite: true,
    speed: 500,
    fade: true,
    autoplay: false,
    cssEase: 'linear'
});

$(function(){
	$('.js-bar').slimScroll();
});

$('.popup-show__close').on('click', function(){
	$(".popup").removeClass("active");
	$("html").removeClass("js-locked");
});

$('.js-popup-ct').on('click', function(e){
	e.preventDefault();
	$("#popup-ct").addClass("active");
	$("html").addClass("js-locked");
});
$('.js-popup-01').on('click', function(e){
	e.preventDefault();
	$("#popup-01").addClass("active");
	$("html").addClass("js-locked");
});
$('.js-popup-02').on('click', function(e){
	e.preventDefault();
	$("#popup-02").addClass("active");
	$("html").addClass("js-locked");
});

$(function () {
	var headerHeight = $('#header').outerHeight();
	var urlHash = location.hash;
	if (urlHash) {
		$('body,html').stop().scrollTop(0);
		setTimeout(function () {
			var target = $(urlHash);
			var position = target.offset().top - headerHeight;
			$('body,html').stop().animate({scrollTop: position}, 700);
		}, 100);
	}
	
	jQuery('.js-scroll').click(function(e) {
		$(".js-mobile").toggleClass("js-mobile--close");
		$("html").removeClass("js-locked");
		$(".header-nav").fadeOut();
		jQuery('html,body').animate({ scrollTop: jQuery(this.hash).offset().top - headerHeight}, 700);
		return false;
		e.preventDefault();
	});
	
});