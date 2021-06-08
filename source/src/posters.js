import { html } from "lit-element";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

import loadImage from "image-promise";

import loaderIcon from "./svg/loader.svg";

import Provider_iconNetflix from "./svg/netflix.svg";
import Provider_iconApple from "./svg/apple.svg";

import Quality_8k from "./svg/8k.svg";
import Quality_4k from "./svg/4k.svg";
import Quality_HD from "./svg/hd.svg";
import Quality_SD from "./svg/sd.svg";

import Icon_Star from "./svg/star_split.svg";

const providers = {
  netflix: unsafeHTML(Provider_iconNetflix),
  itunes: unsafeHTML(Provider_iconApple),
};

const quality = {
  eightK: unsafeHTML(Quality_8k),
  fourK: unsafeHTML(Quality_4k),
  HD: unsafeHTML(Quality_HD),
  SD: unsafeHTML(Quality_SD),
};

const starRating = {
  create: function (rating, max = 10, star_count = 5) {
    let stars = [];

    for (let i = 0; i < star_count; i++) {
      let normalize = rating / (max / star_count) - i;

      if (normalize > 0.5 && normalize < 1) {
        stars.push(this._half);
      } else if (normalize > 1) {
        stars.push(this._full);
      } else {
        stars.push(this._empty);
      }
    }

    return stars;
  },
  _full: Icon_Star.slice(0, 5) + 'class="full" ' + Icon_Star.slice(5),
  _half: Icon_Star.slice(0, 5) + 'class="half" ' + Icon_Star.slice(5),
  _empty: Icon_Star.slice(0, 5) + 'class="empty" ' + Icon_Star.slice(5),
};

export let hass_handler;
export let config_handler;
export let root_handler;
export let justwatch_handler;

const adb_commands = {
  // Netflix
  nfx: "am start -n com.netflix.mediaclient/.ui.launch.UIWebViewActivity -a android.intent.action.VIEW -d {url}",
};

let media_command = {
  type: "empty",
  url: "",
};

export function startMedia_handler() {
  if (config_handler.media_device == null || media_command.type == "empty")
    return false;
  /*console.log(media_command, {
    entity_id: config_handler.media_device,
    command: adb_commands[media_command.type].replace("url", media_command.url),
  });*/

  hass_handler.callService("androidtv", "adb_command", {
    entity_id: config_handler.media_device,
    command: adb_commands[media_command.type].replace(
      "{url}",
      media_command.url
    ),
  });
}

// multiple click onload prevention
let previousClick = false;

function clickPoster(e, data) {
  // pass if already clicked
  if (previousClick == data.id) return true;

  // make animation visible
  root_handler
    .querySelectorAll(".poster .loader")
    .forEach((el) => (el.style.display = "none"));
  e.target.querySelector(".loader").style.display = "block";

  // set reference
  previousClick = data.id;

  // onload backdrop image
  loadImage(data.backdrops[0].backdrop_url)
    .then(function (img) {
      // Get extra data
      justwatch_handler
        .request(data.object_type, undefined, undefined, undefined, data.id)
        .then(function (res) {
          showInfo(data.id, img.src, data, res);
        })
        .catch(function (e) {
          // reset the multiple click prevention
          if (previousClick == data.id) previousClick = false;
          root_handler
            .querySelectorAll(".poster .loader")
            .forEach((el) => (el.style.display = "none"));
          console.error("Additional data failed to load", e);
        });
    })
    .catch(function () {
      // reset the multiple click prevention
      if (previousClick == data.id) previousClick = false;
      root_handler
        .querySelectorAll(".poster .loader")
        .forEach((el) => (el.style.display = "none"));
      console.error("Image failed to load");
    });

  return false;
}

function showInfo(id, backdrop, data, extra) {
  if (previousClick != id) return false;

  // find director
  let director = "-";
  for (let i = 0; i < extra.credits.length; i++) {
    const person = extra.credits[i];
    if (person.role == "DIRECTOR") {
      director = person.name;
      break;
    }
  }

  // format runtime
  let runtime_H = Math.floor(extra.runtime / 60);
  let runtime_M = extra.runtime % 60;
  let runtime = " " + runtime_M + "min";
  if (runtime_H > 0) runtime = runtime_H + "h" + runtime;

  root_handler
    .querySelectorAll(".poster .loader")
    .forEach((el) => (el.style.display = "none"));
  previousClick = false;

  // define background
  root_handler.querySelector("ha-card #backdrop").style.backgroundImage =
    "url(" + backdrop + ")";
  // hide animate posters
  root_handler.querySelector("#posterWrapper").style.top = "100%";
  // hide animate search
  root_handler.querySelector("#search").style.top = "-50%";

  // fill data
  root_handler.querySelector("#details .poster").style.backgroundImage =
    "url(" + data.poster + ")";

  // Title
  root_handler.querySelector("#details > svg.title > text").innerHTML =
    data.title;

  // Genre
  root_handler.querySelector(
    "#details .tags .skewData svg:nth-child(1) > text"
  ).innerHTML = justwatch_handler.genres[extra.genre_ids[0]];
  // Release
  root_handler.querySelector(
    "#details .tags .skewData svg:nth-child(2) > text"
  ).innerHTML = data.original_release_year;
  // Director
  root_handler.querySelector(
    "#details .tags .skewData svg:nth-child(3) > text"
  ).innerHTML = director;
  // Runtime
  root_handler.querySelector(
    "#details .tags .skewData svg:nth-child(4) > text"
  ).innerHTML = runtime;
  // Popularity name
  root_handler.querySelector(
    "#details .tags .skew svg:nth-child(5) > text"
  ).innerHTML = data.popularity.name.toUpperCase();
  // Popularity score
  root_handler.querySelector(
    "#details .tags .skewData svg:nth-child(5) > text"
  ).innerHTML = data.popularity.value.toFixed(1);

  // Text
  root_handler.querySelector("#details .text").innerHTML =
    extra.short_description;

  // make visible
  root_handler.querySelector("#backdrop").style.opacity = "1";
  root_handler.querySelector("#details").style.marginTop = "0%";

  // send to media handler
  media_command.type = data.mainProvider.short;
  media_command.url = data.mainUrl;
}

export function poster(data) {
  return html`
    <div
      class="poster"
      tmdb="${data.id}"
      type="${data.media_type}"
      style='background-image: url("${data.poster}");'
      @click="${(e) => {
        clickPoster(e, data);
      }}"
    >
      <div class="quality">${quality[data.highestQuality]}</div>
      <div class="star_rating">
        <div class="positioner">
          ${starRating
            .create(data.popularity.value)
            .map((item) => html`${unsafeHTML(item)}`)}
        </div>
      </div>
      <div class="loader">${unsafeHTML(loaderIcon)}</div>
    </div>
  `;
}
