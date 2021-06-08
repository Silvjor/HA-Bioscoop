import { LitElement, html, css, unsafeCSS } from "lit-element";
import { render } from "lit-html";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";
import { until } from "lit-html/directives/until";

import searchIcon from "./svg/search.svg";
import loaderIcon from "./svg/loader.svg";
import movieIcon from "./svg/filmstrip.svg";
import showIcon from "./svg/television-classic.svg";

export class SearchBox {
  init(
    config = [],
    shadowroot = null,
    JustWatch_handler = false,
    poster_handler = false
  ) {
    this.config = config;
    this.shadowroot_handler = shadowroot;
    this.JustWatch_handler = JustWatch_handler;
    this.poster_handler = poster_handler;
  }

  // checkbox logic
  // prevent none from being selected
  checkbox(e) {
    const checkboxes = e.path[3].querySelectorAll('input[type="checkbox"]');

    let n_checked = 1;

    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) n_checked++;
    }

    if (n_checked == checkboxes.length) {
      for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
      }
      e.path[1].querySelector('input[type="checkbox"]').checked = true;
    }

    if (n_checked == 1) e.preventDefault();
  }

  searchRequest(e) {
    e.preventDefault();

    let posterWrapper = this.shadowroot_handler.querySelector("#posterWrapper");
    let searchIcns =
      this.shadowroot_handler.querySelectorAll("#search button svg");

    // return empty if posters not yet visible
    if (!posterWrapper) return false;

    let contentTypes = [
      ...e.path[0].querySelectorAll('input[type="checkbox"]:checked'),
    ].map((item) => item.value);

    let providers = this.config.providersFull.map((item) => item.short);

    searchIcns[0].style.opacity = "0";
    searchIcns[1].style.opacity = "1";

    this.JustWatch_handler.request(
      "search",
      contentTypes,
      "all", //fields
      undefined, //providers
      undefined, // mediaID
      e.path[0].querySelector('input[type="search"]').value
    )
      .then((res) => {
        render(
          res.items
            .slice(0, this.config.poster_count)
            .map((item) => html`${this.poster_handler(item)}`),
          posterWrapper // place data in this object
        );
        searchIcns[0].style.opacity = "1";
        searchIcns[1].style.opacity = "0";
      })
      .catch(function (e) {
        searchIcns[0].style.opacity = "1";
        searchIcns[1].style.opacity = "0";
      });

    return false;
  }

  spawnElement() {
      
    return html`
      <div id="search">
        <form name="search" @submit=${(e) => this.searchRequest(e)}>
          <input type="search" value="" placeholder="Search" />
          <button type="submit">
            ${unsafeHTML(searchIcon)}${unsafeHTML(loaderIcon)}
          </button>
          <div class="types">
            <div class="type">
              <input @click="${(e) => this.checkbox(e)} name="type"
              type="checkbox" value="movie" id="type-movie" checked>
              <label for="type-movie"> ${unsafeHTML(movieIcon)} </label>
            </div>
            <div class="type">
              <input @click="${(e) => this.checkbox(e)} name="type"
              type="checkbox" value="show" id="type-show" checked>
              <label for="type-show"> ${unsafeHTML(showIcon)} </label>
            </div>
          </div>
        </form>
      </div>
    `;
  }
}
