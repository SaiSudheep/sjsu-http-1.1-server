//Important when moving file location change apiService location
let apiService = 'https://www.sjsu.edu/_resources/vimeo-api/service.php?v=1.1'
let player = ''
let showcaseEl = document.getElementsByClassName("vimeo-showcase")
for (let i = 0; i < showcaseEl.length; i++) {
    let vimId = showcaseEl[i].getAttribute("vimeo-id")
    let vimType = showcaseEl[i].getAttribute("vimeo-type")
    sjsuVimeoPlaylist(vimId, vimType)
}

function sjsuVimeoPlaylist(vimId, vimType) {
    let vimeoShowcases = {}
    let vimeoLink = '#'
    if (vimType === "showcase") {
        vimeoLink = '<a target="_blank" href="https://vimeo.com/showcase/' + vimId + '">Vimeo Showcase</a>'
    } else {
        vimeoLink = '<a target="_blank" href="https://vimeo.com/video/' + vimId + '">Vimeo Video</a>'
    }
    let networkErrormsg = '<p style="text-align:center;">Error: Check your network and/or refresh your page.<br> You can also try the direct link to our video page. ' + vimeoLink + '</p>'

    function loadVimeoSwiper() {
        //Vimeo Playlist Scripts
        let swiper = {}
        vimId = Number(vimId)
        swiper[vimId] = new Swiper('.vimeo-showcase[vimeo-id="' + vimId + '"] .vimeo-showcase__playlist .swiper', {
            // Optional parameters
            spaceBetween: 24,
            mousewheel: false,
            threshold: 5,
            a11y: {
                slideRole: 'button',
                slideLabelMessage: false,
            },

            // Navigation arrows
            navigation: {
                nextEl: '.vimeo-showcase[vimeo-id="' + vimId + '"] .swiper-btn-next',
                prevEl: '.vimeo-showcase[vimeo-id="' + vimId + '"] .swiper-btn-prev',
            },
            on: {
                //Adjust slides for window size
                resize: function () {
                    if (window.innerWidth > 1024) {
                        this.params.slidesPerView = 2;
                        this.changeDirection("vertical");
                    } else {
                        this.params.slidesPerView = 1;
                        this.changeDirection("horizontal");
                    }
                },
                init: function () {
                    if (window.innerWidth > 1024) {
                        this.params.slidesPerView = 2;
                        this.changeDirection("vertical");
                    } else {
                        this.params.slidesPerView = 1;
                        this.changeDirection("horizontal");
                    }
                    MicroModal.init({
                        onShow: modal => modalOpen(modal), // [1]
                        onClose: modal => modalClose(modal), // [2]
                        openTrigger: 'data-micromodal-open', // [3]
                        closeTrigger: 'data-micromodal-close', // [4]
                        openClass: 'is-open', // [5]
                        disableScroll: true, // [6]
                        disableFocus: false, // [7]
                        awaitOpenAnimation: true, // [8]
                        awaitCloseAnimation: true
                    });
                    document.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            const target = event.target;
                            if (target.hasAttribute('data-micromodal-open')) {
                                event.preventDefault();
                                console.log(target)
                                target.click();
                            }
                        }
                    });

                    const modal = document.getElementById('modal-1');
                    const iframe = modal.querySelector('.player iframe');
                    

                    //init modal
                    function modalClose() {
                        player.pause()
                        player.getVideoId().then(function (result) {
                            document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] *[data-video-id="' + result + '"]').focus()
                            document.querySelector('#modal-1 .vimeo-video-reveal__info').remove()
                        })
                    }
                    function modalOpen() {
                        //focus on .player
                        document.querySelector('#modal-1 .player').focus()
                    }

                },
                click: function () {
                    //Vimeo Player
                    if (document.querySelector('#modal-1 .player iframe')) {
                        player.loadVideo(swiper[vimId].clickedSlide.getAttribute('data-video-id'))
                    } else {
                        let options = {
                            id: swiper[vimId].clickedSlide.getAttribute('data-video-id'),
                            loop: false,
                            autoplay: true,
                            width: 1920,
                        };
                        player = new Vimeo.Player(document.querySelector('#modal-1 .player'), options);

                    }
                    var desc = ""
                    desc += '<div class="vimeo-video-reveal__info">'
                    desc += '<a href="' + swiper[vimId].clickedSlide.getAttribute('data-vimeo-link') + '"><p class="vimeo-video-reveal__title">'
                    desc += swiper[vimId].clickedSlide.getAttribute('aria-label')
                    desc += '</p></a>'
                    if (swiper[vimId].clickedSlide.getAttribute('data-video-desc') && swiper[vimId].clickedSlide.getAttribute('data-video-desc') != "null") {
                        desc += '<p class="vimeo-video-reveal__description">'
                        desc += swiper[vimId].clickedSlide.getAttribute('data-video-desc')
                        desc += '</p>'
                    }
                    desc += '</div>'
                    document.querySelector('#modal-1 .modal__container').insertAdjacentHTML("beforeend", desc)
                }
            }
        });
    }

    function loadVimeoPlaylist() {
        var timestamp = new Date().getTime();
        $.ajax({
                url: apiService,
                type: 'get',
                cache: false,
                data: {
                    'Id': vimId,
                    'type': vimType,
                    'timestamp': timestamp
                },
                dataType: 'JSON',
                statusCode: {
                    404: function (response) {
                        document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] + .vimeo-showcase-loader').innerHTML = networkErrormsg
                    }
                },
                success: function (response) {
                    if (response.status == 404) {
                        document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] + .vimeo-showcase-loader').innerHTML = networkErrormsg
                    }

                    var featured = ""

                    if (vimType === 'showcase') {
                        vimeoShowcases[vimId] = response.body.data
                        var vimeoFeaturedShowcase = vimeoShowcases[vimId][0]
                        var uri = vimeoFeaturedShowcase.uri
                    }
                    if (vimType === 'video') {
                        vimeoShowcases[vimId] = response.body
                        var vimeoFeaturedShowcase = vimeoShowcases[vimId]
                        var uri = vimeoFeaturedShowcase.uri
                    }

                    featured += '<div class="vimeo-showcase__featured--graphic">'
                    if (vimeoFeaturedShowcase.embed.badges.live.streaming) {
                        featured += '<div class="vimeo-showcase__featured--live">LIVE</div>'
                    }
                    if (vimeoFeaturedShowcase.type === "live" && !vimeoFeaturedShowcase.embed.badges.live.streaming && !vimeoFeaturedShowcase.embed.badges.live.archived) {
                        featured += '<div class="vimeo-showcase__featured--upcoming">UPCOMING</div>'
                    }
                    featured += '<img class="vimeo-showcase__featured--img" src="' + vimeoFeaturedShowcase.pictures.sizes[6].link + '" alt="' + vimeoFeaturedShowcase.name + '"></div>'
                    featured += '<div class="vimeo-showcase__featured--title">'
                    featured += '<div data-micromodal-open="modal-1" class="vimeo-showcase__featured--play-btn" data-vimeo-link=' + vimeoFeaturedShowcase.link + ' data-video-id=' + uri.substring(uri.lastIndexOf('/') + 1) + ' tabindex="0" role="button" aria-label="' + vimeoFeaturedShowcase.name + '" data-video-desc="' + vimeoFeaturedShowcase.description + '"> <svg xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 477 477" style="enable-background:new 0 0 477 477;" xml:space="preserve"> <g id="Layer_1-2"> <circle class="play-btn-outer-circle" cx="238.5" cy="238.5" r="238.5"/> <circle class="play-btn-circle" cx="237.8" cy="238.3" r="206.8"/> <circle class="play-btn-circle-2" cx="237.8" cy="238.3" r="206.8"/> <path class="play-btn-triangle" d="M186.1,161.2v154.1c0,6.2,6.8,9.9,12,6.6l123.6-77.1c4.9-3.1,4.9-10.2,0-13.3l-123.6-77.1 C192.9,151.3,186.1,155.1,186.1,161.2L186.1,161.2z"/> </g> </svg> </div>'
                    featured += '<p class="u-bar u-bar--medium u-bar--sjsu-gold">'
                    featured += vimeoFeaturedShowcase.name
                    featured += '</p></div>'
                    document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] .vimeo-showcase__featured').insertAdjacentHTML("beforeend",
                        featured
                    )


                    if (vimType === 'showcase' && vimeoShowcases[vimId].length > 1) {
                        for (let i = 1; i < vimeoShowcases[vimId].length; i++) {
                            var item = ""
                            var uri = vimeoShowcases[vimId][i].uri
                            item += '<div data-micromodal-open="modal-1" data-slide-index=' + i + ' data-video-id=' + uri.substring(uri.lastIndexOf('/') + 1) + ' class="vimeo-showcase__item swiper-slide"  tabindex="0" aria-label="'
                            item += vimeoShowcases[vimId][i].name + '" data-video-desc="' + vimeoShowcases[vimId][i].description + '" data-vimeo-link="' + vimeoShowcases[vimId][i].link + '">'
                            item += '<div class="vimeo-showcase__item--graphic">'
                            item += '<img class="vimeo-showcase__item--img" src="' + vimeoShowcases[vimId][i].pictures.sizes[3].link + '" alt="' + vimeoShowcases[vimId][i].name + ' thumbnail">'
                            if (vimeoShowcases[vimId][i].embed.badges.live.streaming) {
                                item += '<div class="vimeo-showcase__item--live">LIVE</div>'
                            }
                            if (vimeoShowcases[vimId][i].type == "live" && !vimeoShowcases[vimId][i].embed.badges.live.streaming && !vimeoShowcases[vimId][i].embed.badges.live.archived) {
                                item += '<div class="vimeo-showcase__item--upcoming">UPCOMING</div>'
                            }
                            item += '<div class="vimeo-showcase__item--play-btn"><svg role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 413.6 413.6"><g id="Layer_1-2"><circle class="play-btn-circle" cx="206.8" cy="206.8" r="206.8" /><circle class="play-btn-circle-2" cx="206.8" cy="206.8" r="206.8" /><path class="play-btn-triangle" d="M155.11,129.75v154.1c0,6.16,6.77,9.91,11.99,6.65l123.55-77.05c4.92-3.07,4.92-10.24,0-13.31l-123.55-77.05c-5.22-3.26-11.99,.5-11.99,6.65Z" /></g></svg></div>'
                            item += '</div>'
                            item += '<div class="vimeo-showcase__item--title">'
                            item += '<p class="u-bar u-bar--medium u-bar--sjsu-gold">'
                            item += vimeoShowcases[vimId][i].name
                            item += '</p></div></div>'

                            document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] .swiper-wrapper').insertAdjacentHTML("beforeend",
                                item
                            )
                            console.log("item")

                            if (vimeoShowcases[vimId].length - 1 == i) {
                                loadVimeoSwiper()
                            }
                        }
                    } else {
                        document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] .vimeo-showcase__featured + .vimeo-showcase__info-wrap').classList.add(
                            'hide'
                        )
                        document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] .vimeo-showcase__featured').classList.add(
                            'single-vid'
                        )
                    }

                    document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] .vimeo-showcase__featured--play-btn').addEventListener('click', function () {

                        var btn = this
                        //Vimeo Player
                        if (document.querySelector('#modal-1 .player iframe')) {
                            player.loadVideo(btn.getAttribute('data-video-id'))
                        } else {
                            let options = {
                                id: btn.getAttribute('data-video-id'),
                                loop: false,
                                autoplay: true,
                                width: 1920,
                            };
                            player = new Vimeo.Player(document.querySelector('#modal-1 .player'), options);
                        }


                        var desc = ""
                        desc += '<div class="vimeo-video-reveal__info">'
                        desc += '<a href="' + btn.getAttribute('data-vimeo-link') + '"><p class="vimeo-video-reveal__title">'
                        desc += btn.getAttribute('aria-label')
                        desc += '</p></a>'
                        if (btn.getAttribute('data-video-desc') && btn.getAttribute('data-video-desc') != "null") {
                            desc += '<p class="vimeo-video-reveal__description">'
                            desc += btn.getAttribute('data-video-desc')
                            desc += '</p>'
                        }
                        desc += '</div>'
                        document.querySelector('#modal-1 .modal__container').insertAdjacentHTML("beforeend", desc)

                    })
                    document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"]').classList.remove('hide')
                    document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] + .vimeo-showcase-loader').classList.add('hide')

                        },
                        error: function (response) {
                            document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] + .vimeo-showcase-loader').innerHTML = networkErrormsg
                        },
                        timeout: function (response) {
                            document.querySelector('.vimeo-showcase[vimeo-id="' + vimId + '"] + .vimeo-showcase-loader').innerHTML = networkErrormsg
                        },

                })
        }
        window.addEventListener('load', function () {
            loadVimeoPlaylist();
        })

    }