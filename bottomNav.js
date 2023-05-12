const navButtons = document.querySelectorAll(".tab-bar button");

const buttonWrapper = (selector, callback) => {
  const button = document.querySelector(selector);
  const path = button.querySelector(":scope > svg path");

  button.addEventListener("click", () => {
    if (button.classList.contains("active")) {
      return;
    }

    navButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    callback(button, path);
  });
};

buttonWrapper(".tab-bar button.home", (button, path) => {
  gsap.to(button, {
    "--tab-bar-home-scale": 0.25,
    "--tab-bar-home-opacity": 0,
    duration: 0.1,
    onComplete: () => {
      gsap.to(path, {
        keyframes: [
          {
            morphSVG:
              "M12.6387 3.53796L15.1949 7.69178C15.7004 8.51322 15.7802 9.5276 15.4092 10.4179L11.3846 20.0769C11.2016 20.516 11.5243 21 12 21V21C12.4757 21 12.7984 20.516 12.6154 20.0769L8.5908 10.4179C8.21983 9.5276 8.29956 8.51322 8.80506 7.69178L11.3613 3.53796C11.6541 3.06206 12.3459 3.06206 12.6387 3.53796Z",
            duration: 0.1,
          },
          {
            morphSVG:
              "M12.1483 3.46366L12.8548 8.05624C12.9493 8.67024 12.8508 9.29842 12.573 9.85405L8.08541 18.8292C7.58673 19.8265 8.31198 21 9.42705 21H14.5729C15.688 21 16.4133 19.8265 15.9146 18.8292L11.427 9.85405C11.1492 9.29842 11.0507 8.67024 11.1452 8.05624L11.8517 3.46366C11.8778 3.29407 12.1222 3.29407 12.1483 3.46366Z",
            duration: 0.09,
          },
          {
            morphSVG:
              "M21 18V10.5339C21 9.57062 20.5374 8.66591 19.7565 8.1019L13.7565 3.76856C12.7079 3.01128 11.2921 3.01128 10.2435 3.76856L4.24353 8.1019C3.46259 8.66591 3 9.57062 3 10.5339V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18Z",
            duration: 0.71,
            ease: "elastic.out(1, .9)",
            onStart: () => {
              gsap.to(button, {
                "--tab-bar-home-scale": 0.7,
                duration: 0.71,
                ease: "elastic.out(1, .9)",
              });
              gsap.to(button, {
                "--tab-bar-home-opacity": 1,
                duration: 0.2,
              });
            },
          },
        ],
      });
    },
  });
});

buttonWrapper(".tab-bar button.chart", (button, path) => {
  gsap.to(button, {
    "--tab-bar-chart-1-offset": "3px",
    duration: 0.04,
  });

  gsap.to(button, {
    "--tab-bar-chart-2-offset": "9px",
    duration: 0.04,
    delay: 0.02,
  });

  gsap.to(button, {
    "--tab-bar-chart-3-offset": "5px",
    duration: 0.04,
    delay: 0.04,
  });

  gsap.to(button, {
    "--tab-bar-chart-4-offset": "10px",
    duration: 0.04,
    delay: 0.06,
    onComplete: () => {
      gsap.to(path, {
        keyframes: [
          {
            morphSVG:
              "M9.09255 6.28652C8.55318 4.66775 9.75809 2.99625 11.4644 2.99625H12.5356C14.2419 2.99625 15.4468 4.66775 14.9074 6.28652L10.6348 19.1099C10.3243 20.0416 11.0179 21.0037 12 21.0037V21.0037C12.9821 21.0037 13.6757 20.0416 13.3652 19.1099L9.09255 6.28652Z",
            duration: 0.1,
          },
          {
            morphSVG:
              "M11.3599 3.9318C11.1849 3.48163 11.517 2.99625 12 2.99625V2.99625C12.483 2.99625 12.8151 3.48163 12.6401 3.9318L8.17629 15.4149C7.13091 18.1041 9.11474 21.0037 12 21.0037V21.0037C14.8853 21.0037 16.8691 18.1041 15.8237 15.4149L11.3599 3.9318Z",
            duration: 0.1,
          },
          {
            morphSVG:
              "M20.9963 7.99624C20.9963 5.23482 18.7577 2.99625 15.9963 2.99625H8.00376C5.24233 2.99625 3.00375 5.23482 3.00375 7.99625V16.0037C3.00375 18.7652 5.24233 21.0037 8.00375 21.0037H15.9963C18.7577 21.0037 20.9963 18.7652 20.9963 16.0037V7.99624Z",
            duration: 0.7,
            ease: "elastic.out(1, .9)",
            onStart: () => {
              gsap.to(button, {
                "--tab-bar-chart-1-offset": "6px",
                duration: 0.1,
              });

              gsap.to(button, {
                "--tab-bar-chart-2-offset": "18px",
                duration: 0.1,
                delay: 0.05,
              });

              gsap.to(button, {
                "--tab-bar-chart-3-offset": "10px",
                duration: 0.1,
                delay: 0.1,
              });

              gsap.to(button, {
                "--tab-bar-chart-4-offset": "17px",
                duration: 0.55,
                delay: 0.15,
                ease: "elastic.out(1, .9)",
              });
            },
          },
        ],
      });
    },
  });
});

buttonWrapper(".tab-bar button.marker", (button, path) => {
  gsap.to(button, {
    "--tab-bar-marker-scale": 0.25,
    "--tab-bar-marker-opacity": 0,
    duration: 0.1,
    onComplete: () => {
      gsap.to(path, {
        keyframes: [
          {
            morphSVG:
              "M12 21C12 21 15.3954 18.8605 13.3637 16C12.0647 14.1711 9.51275 11.9823 9 10C8 6.134 10.134 3 12 3C13.866 3 16 6.134 15 10C14.4873 11.9823 11.9353 14.1711 10.6363 16C8.60464 18.8605 12 21 12 21Z",
            duration: 0.1,
          },
          {
            morphSVG:
              "M12 21C12 21 14.0216 19.0215 14.3637 16C14.6026 13.8898 13.5128 11.9823 13 10C12 6.134 13.134 3 12 3C10.866 3 12 6.134 11 10C10.4873 11.9823 9.39736 13.8898 9.6363 16C9.97843 19.0215 12 21 12 21Z",
            duration: 0.05,
          },
          {
            morphSVG:
              "M12 21C12 21 14.6062 18.8589 16.64 16C17.941 14.1711 19 12.0475 19 10C19 6.134 15.87 3 12 3C8.13 3 5 6.134 5 10C5 12.0475 6.05896 14.1711 7.36 16C9.39381 18.8589 12 21 12 21Z",
            duration: 0.75,
            ease: "elastic.out(1, .9)",
            onStart: () => {
              gsap.to(button, {
                "--tab-bar-marker-scale": 0.7,
                duration: 0.75,
                ease: "elastic.out(1, .9)",
              });
              gsap.to(button, {
                "--tab-bar-marker-opacity": 1,
                duration: 0.2,
              });
            },
          },
        ],
      });
    },
  });
});

buttonWrapper(".tab-bar button.trophy", (button, path) => {
  gsap.to(button, {
    "--tab-bar-trophy-x": "5px",
    duration: 0.1,
    onComplete: () => {
      gsap.to(path, {
        keyframes: [
          {
            morphSVG:
              "M12.544 16.5H11.456C10.7543 16.5 10.2708 15.796 10.5227 15.141L14.4773 4.85898C14.7292 4.20398 14.2457 3.5 13.544 3.5H10.456C9.75425 3.5 9.27076 4.20398 9.52268 4.85898L13.4773 15.141C13.7292 15.796 13.2457 16.5 12.544 16.5Z",
            duration: 0.1,
            onStart: () => {
              gsap.to(button, {
                keyframes: [
                  {
                    "--tab-bar-trophy-scale": 0.25,
                    duration: 0.15,
                  },
                  {
                    "--tab-bar-trophy-scale": 0.75,
                    duration: 0.2,
                  },
                ],
              });
            },
          },
          {
            morphSVG:
              "M12.4891 16.5H11.5109C9.79243 16.5 8.58632 14.8062 9.14846 13.1822L12.3364 3.97249C12.4165 3.74122 12.2447 3.5 12 3.5V3.5C11.7553 3.5 11.5835 3.74122 11.6636 3.97249L14.8515 13.1822C15.4137 14.8062 14.2076 16.5 12.4891 16.5Z",
            duration: 0.1,
          },
          {
            morphSVG:
              "M8 3.5H16C16.5523 3.5 17 3.94772 17 4.5V12.5C17 14.7091 15.2091 16.5 13 16.5H11C8.79086 16.5 7 14.7091 7 12.5V4.5C7 3.94772 7.44772 3.5 8 3.5Z",
            duration: 0.7,
            ease: "elastic.out(1, .9)",
            onStart: () => {
              gsap.to(button, {
                "--tab-bar-trophy-x": "0px",
                duration: 0.6,
                delay: 0.1,
                ease: "elastic.out(1, .9)",
              });
            },
          },
        ],
      });
    },
  });
});

buttonWrapper(".tab-bar button.user", (button, path) => {
  gsap.to(button, {
    "--tab-bar-user-y": "6px",
    "--tab-bar-user-scale": 0.25,
    "--tab-bar-user-opacity": 0,
    duration: 0.1,
    onComplete: () => {
      gsap.to(path, {
        keyframes: [
          {
            morphSVG:
              "M12 21C12 21 15.3954 18.8605 13.3637 16C12.0647 14.1711 9.51275 11.9823 9 10C8 6.134 10.134 3 12 3C13.866 3 16 6.134 15 10C14.4873 11.9823 11.9353 14.1711 10.6363 16C8.60464 18.8605 12 21 12 21Z",
            duration: 0.125,
          },
          {
            morphSVG:
              "M13.364 5.63604C14.0062 9.12971 7.68417 13.4401 8.36401 18.3639C8.84929 21.8787 15.1508 21.8787 15.6361 18.3639C16.316 13.4401 9.99389 9.12969 10.6361 5.63604C11.3564 1.71793 12.6438 1.71795 13.364 5.63604Z",
            duration: 0.05,
          },
          {
            morphSVG:
              "M5.64 5.63604C2.12001 9.15 2.12 14.85 5.63998 18.3639C9.15 21.8787 14.85 21.8787 18.36 18.3639C21.88 14.85 21.88 9.15074 18.36 5.63604C14.85 2.12 9.15001 2.12 5.64 5.63604Z",
            duration: 0.8,
            ease: "elastic.out(1, .9)",
            onStart: () => {
              gsap.to(button, {
                "--tab-bar-user-scale": 0.7,
                "--tab-bar-user-y": "0px",
                duration: 0.8,
                ease: "elastic.out(1, .9)",
              });
              gsap.to(button, {
                "--tab-bar-user-opacity": 1,
                duration: 0.2,
              });
            },
          },
        ],
      });
    },
  });
});