import { name as CARD_NAME } from "../package.json";
import { LitElement, html, css, unsafeCSS } from "lit-element";
import { until } from "lit-html/directives/until";
import { unsafeHTML } from "lit-html/directives/unsafe-html.js";

import loadImage from "image-promise";

import { JustWatch } from "./justwatch.js";
import { SearchBox } from "./search.js";

import {
  poster,
  hass_handler,
  root_handler,
  justwatch_handler,
  startMedia_handler,
  config_handler,
} from "./posters.js";

import CSS_style from "./css/style.css";
import loaderIcon from "./svg/loader.svg";
import backIcon from "./svg/back.svg";

class BioscoopCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  render() {
    hass_handler = this.hass;
    config_handler = this.config;
    root_handler = this.shadowRoot;
    justwatch_handler = this.JustWatch;

    this.SearchBox.init(this.config, this.shadowRoot, this.JustWatch, poster);
    this.JustWatch.init(this.config);

    const oneDay = 1000 * 60 * 60 * 24;
    let request;
    let now = new Date();

    if (!this.lastUpdate) {
      this.lastResult = (async () => {
        // loading
        while (!this.config.hasOwnProperty("providersFull")) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        // loaded
        this.lastUpdate = new Date(
          new Date().toISOString().split("T")[0] + "T00:00:00Z"
        );
        return this.JustWatch.request(
          "popular",
          "movie",
          "all",
          this.config.providersFull.map((item) => item.short)
        );
      })();
    } else if (now > this.lastUpdate.getTime() + oneDay) {
      this.lastUpdate = new Date(
        new Date().toISOString().split("T")[0] + "T00:00:00Z"
      );
      this.lastResult = (async () => {
        return this.JustWatch.request();
      })();
    }

    if (this.lastUpdate) {
      this.shadowRoot.querySelector("#backdrop").style.opacity = "0";
      this.shadowRoot.querySelector("#details").style.marginTop = "100%";
    }

    const cardReturn = html``;

    return html`<ha-card>
      ${this.SearchBox.spawnElement()}
      <div id="backdrop"></div>
      <div id="details">
        <div
          class="return"
          @click="${(e) => {
            this.shadowRoot.querySelector("#posterWrapper").style.top = "";
            this.shadowRoot.querySelector("#search").style.top = "";
            this.shadowRoot.querySelector("#backdrop").style.opacity = "0";
            this.shadowRoot.querySelector("#details").style.marginTop = "100%";
          }}"
        >
          ${unsafeHTML(backIcon)}
        </div>
        <div class="poster"></div>
        <svg class="title" viewBox="0 0 300 22">
          <text x="0" y="15">Empty</text>
        </svg>
        <div
          class="play"
          @click="${(e) => {
            startMedia_handler();
          }}"
        >
          PLAY
        </div>
        <div class="text"></div>

        <div class="tags">
          <div class="skewData">
            <svg viewBox="0 0 180 22">
              <text x="0" y="15">-</text>
            </svg>
            <svg viewBox="0 0 180 22">
              <text x="0" y="15">-</text>
            </svg>
            <svg viewBox="0 0 180 22">
              <text x="0" y="15">-</text>
            </svg>
            <svg viewBox="0 0 180 22">
              <text x="0" y="15">-</text>
            </svg>
            <svg viewBox="0 0 180 22">
              <text x="0" y="15">-</text>
            </svg>
          </div>
          <div class="skew">
            <svg viewBox="0 0 80 22">
              <text text-anchor="end" x="80" y="15">Genre</text>
            </svg>
            <svg viewBox="0 0 80 22">
              <text text-anchor="end" x="80" y="15">Release</text>
            </svg>
            <svg viewBox="0 0 80 22">
              <text text-anchor="end" x="80" y="15">Director</text>
            </svg>
            <svg viewBox="0 0 80 22">
              <text text-anchor="end" x="80" y="15">Runtime</text>
            </svg>
            <svg viewBox="0 0 80 22">
              <text text-anchor="end" x="80" y="15">IMDB</text>
            </svg>
          </div>
        </div>
      </div>

      ${until(
        this.lastResult.then((res) =>
          res
            ? // Data has loaded now get the images
              until(
                loadImage(
                  // map all the images
                  res.items
                    .slice(0, this.config.poster_count)
                    .map((item) => item.poster)
                ).then((img) =>
                  img
                    ? // Images have loaded show the cards
                      html`<div id="posterWrapper">
                        ${res.items
                          .slice(0, this.config.poster_count)
                          .map((item) => html`${poster(item)}`)}
                      </div>`
                    : html`False`
                ),
                // Loader for the images
                html`<div id="mainLoader">
                  ${unsafeHTML(loaderIcon)}
                  <div>LOADING<br />IMAGES</div>
                </div>`
              )
            : html`False`
        ),
        // Loader for the data
        html`<div id="mainLoader">
          ${unsafeHTML(loaderIcon)}
          <div>LOADING<br />DATA</div>
        </div>`
      )}
    </ha-card> `;
  }

  setConfig(config) {
    const fullConfig = JSON.parse(JSON.stringify(config));

    if (!config.poster_count) {
      fullConfig.poster_count = 5;
    }
    if (!config.media_region) {
      fullConfig.media_region = "nl";
    }

    this.JustWatch = new JustWatch(fullConfig.media_region);
    this.SearchBox = new SearchBox();

    if (!fullConfig.providers) {
      fullConfig.providers = ["netflix"];
    }

    if (!fullConfig.media_device) {
      fullConfig.media_device = null;
    }

    let providers = [];
    this.JustWatch.getProviders().then((res) => {
      for (let i = 0; i < fullConfig.providers.length; i++) {
        for (let j = 0; j < res.length; j++) {
          if (res[j].name.toLowerCase().indexOf(fullConfig.providers[i]) > -1) {
            providers.push(res[j]);
            break;
          }
        }
      }
      fullConfig.providersFull = providers;
    });

    this.config = fullConfig;
  }

  getCardSize() {
    return 3;
  }

  static get styles() {
    /*
    Only use the unsafeCSS tag with trusted input.
    Injecting unsanitized CSS is a security risk. For example,
    malicious CSS can “phone home” by adding an image URL
    that points to a third-party server.
    */
    return [
      css`
        ${unsafeCSS(CSS_style)}
      `,
    ];
  }
}

customElements.define(CARD_NAME, BioscoopCard);
