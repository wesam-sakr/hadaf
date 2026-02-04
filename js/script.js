

$(document).ready(function () {
  // website lang
  var bodyDir = $("body").css("direction");
  console.log(bodyDir);
  var dirAr;
  if (bodyDir == "rtl") {
    dirAr = true;
  } else {
    dirAr = false;
  }

  $("#filter").click(function () {
    $(".filter").toggleClass("filter-toggle");
  });
  $(".filter-header .btn-close").click(function () {
    $(".filter").toggleClass("filter-toggle");
  });


  // const burgerBtn = document.getElementById("burgerBtn");
  // const menuOverlay = document.getElementById("menuOverlay");
  // const closeMenu = document.getElementById("closeMenu");

  // burgerBtn.onclick = () => {
  //   menuOverlay.classList.add("active");
  // };

  // closeMenu.onclick = () => {
  //   menuOverlay.classList.remove("active");
  // };


  const burgerBtn = document.getElementById("burgerBtn");
  const menuOverlay = document.getElementById("menuOverlay");
  const closeMenu = document.getElementById("closeMenu");

  // فتح / قفل بالزرار ☰
  burgerBtn.addEventListener("click", () => {
    menuOverlay.classList.toggle("active");
  });

  // زرار X يقفل فقط ❌
  closeMenu.addEventListener("click", () => {
    menuOverlay.classList.remove("active");
  });

  // قفل المينيو عند الاسكرول ⬇️
  window.addEventListener("scroll", () => {
    if (menuOverlay.classList.contains("active")) {
      menuOverlay.classList.remove("active");
    }
  });

  // سلايدر الخدمات
  const track = document.getElementById("textTrack");
  const items = track.children;
  const itemHeight = items[0].offsetHeight;
  let index = 0;

  setInterval(() => {
    index++;

    if (index >= items.length) {
      index = 0;
    }

    track.style.transform = `translateY(-${index * itemHeight}px)`;
  }, 2500);


  $(".hero-sec .cars-slider.owl-carousel").owlCarousel({
    nav: false,
    center: true,
    responsiveClass: true,
    margin: 16,
    loop: true,
    items: 1.2,
    dots: true,
    autoplay: true,
    animateOut: 'fadeOut',
    rtl: dirAr,
    responsive: {
      992: {
        items: 1.4
      },
    }
  });

  var swiper = new Swiper(".partners .swiper", {
    loop: true,
    speed: 3000,
    slidesPerView: 6,
    spaceBetween: 0,
    freeMode: true,
    freeModeMomentum: false,
    autoplay: {
      delay: 0,
      disableOnInteraction: false
    },
    breakpoints: {
      1400: {
        slidesPerView: 6
      },
      992: {
        slidesPerView: 5
      },
      768: {
        slidesPerView: 5
      },
      576: {
        slidesPerView: 3
      },
      0: {
        slidesPerView: 1.4,
        spaceBetween: 0,
      }
    }

  });


  $(".projects .owl-carousel").owlCarousel({
    nav: false,
    loop: true,
    autoplay: true,
    responsiveClass: true,
    stagePadding: 120,
    items: 1,
    margin: 16,
    rtl: dirAr,
    responsive: {
      0: {
        stagePadding: 20,
      },
      768: {
        stagePadding: 60,
      },
      992: {
        stagePadding: 80,
      }
    }

  });

  $(".testimonials .owl-carousel").owlCarousel({
    nav: false,
    loop: true,
    autoplay: true,
    responsiveClass: true,
    stagePadding: 40,
    margin: 16,
    rtl: dirAr,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      992: {
        items: 3
      }
    }
  });

  $(".blogs .owl-carousel").owlCarousel({
    nav: false,
    loop: false,
    responsiveClass: true,
    margin: 16,
    stagePadding: 40,
    rtl: dirAr,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      992: {
        items: 3
      }
    }
  });


  // expand cards
  document.querySelectorAll('.car-gallery-slider .item').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.car-gallery-slider .item').forEach(c => {
        c.classList.remove('active-card');
        c.classList.add('small-card');
      });
      card.classList.add('active-card');
      card.classList.remove('small-card');
    });
  });

  // upload file or image
  $(".file-input").change(function () {
    const fileInput = $(this).find('[type="file"]')[0];
    const label = $(this).find("[data-js-label]")[0];
    console.log($(fileInput).val());
    if (!$(fileInput).val()) return;
    var value = $(fileInput)
      .val()
      .replace(/^.*[\\\/]/, "");
    $(label).html(value);
  });

  // upload and preview multiple images such as dropzone
  function ImgUpload() {
    var imgWrap = "";
    var imgArray = [];

    $('.upload__inputfile').each(function () {
      $(this).on('change', function (e) {
        imgWrap = $(this).closest('.upload__box').find('.upload__img-wrap');
        var maxLength = $(this).attr('data-max_length');

        var files = e.target.files;
        var filesArr = Array.prototype.slice.call(files);
        var iterator = 0;
        filesArr.forEach(function (f, index) {

          if (!f.type.match('image.*')) {
            return;
          }

          if (imgArray.length > maxLength) {
            return false
          } else {
            var len = 0;
            for (var i = 0; i < imgArray.length; i++) {
              if (imgArray[i] !== undefined) {
                len++;
              }
            }
            if (len > maxLength) {
              return false;
            } else {
              imgArray.push(f);

              var reader = new FileReader();
              reader.onload = function (e) {
                var html = `
                <div class="col">
                    <div class='upload__img-box'>
                        <div 
                        data-number='${$(".upload__img-close").length}' 
                        data-file='${f.name}' 
                        class='img-bg'>
                            <div class='upload__img-close'></div>
                            <img src='${e.target.result}'>
                        </div>
                    </div>
                </div>`;
                imgWrap.append(html);
                iterator++;
              }
              reader.readAsDataURL(f);
            }
          }
          console.log(imgArray)
        });
      });
    });

    $(document).on('click', ".upload__img-close", function (e) {
      var inputElement = $('.upload__inputfile')[0];

      // Select the image to be deleted.
      var fileName = $(this).parent().data("file");

      // Create a DataTransfer object to save new files after deletion
      var dt = new DataTransfer();

      // Update the array with the specified file deleted
      imgArray = imgArray.filter(file => file.name !== fileName);

      // Update input[type=file] with remaining files.
      for (var i = 0; i < inputElement.files.length; i++) {
        if (inputElement.files[i].name !== fileName) {
          dt.items.add(inputElement.files[i]);
        }
      }

      // Reset files to input[type=file]
      inputElement.files = dt.files;

      // Remove item from UI
      $(this).closest('.col').remove();

      console.log("remaining files :", imgArray);
    });

  }
  ImgUpload()

  // select2
  $('select').select2();

});
