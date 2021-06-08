import axios from "axios";

export class JustWatch {
  constructor(
    locale = "NL",
    baseUrl = "https://apis.justwatch.com/content/",
    imageUrl = "https://images.justwatch.com",
    timeout = 5000
  ) {
    this.locales(locale);

    this.baseUrl = baseUrl;
    this.imageUrl = imageUrl;
    this.timeout = timeout;
    this.providers = null;
    this.config = null;
    //https://apis.justwatch.com/content/genres/locale/nl_NL
    this.genres = {
      1: "Action & Adventure",
      2: "Animation",
      3: "Comedy",
      4: "Crime",
      5: "Documentary",
      6: "Drama",
      7: "Fantasy",
      8: "History",
      9: "Horror",
      10: "Kids & Family",
      11: "Music & Musical",
      12: "Mystery & Thriller",
      13: "Romance",
      14: "Science-Fiction",
      15: "Sport",
      16: "War & Military",
      17: "Western",
      23: "Reality TV",
      18: "Made in Europe",
    };
  }

  init(config){
    this.config = config;
  }

  locales(str) {
    //https://apis.justwatch.com/content/locales/state
    //\{"exposed_url_part":"([a-z]{2}).*?"full_locale":"([a-z]{2}_[A-Z]{2})".*?"iso_3166_2":"([A-Z]{2})".*?\}\}[,]?
    let countryList = [
      { country: "us", full: "en_US", iso: "US" },
      { country: "de", full: "de_DE", iso: "DE" },
      { country: "br", full: "pt_BR", iso: "BR" },
      { country: "au", full: "en_AU", iso: "AU" },
      { country: "nz", full: "en_NZ", iso: "NZ" },
      { country: "ca", full: "en_CA", iso: "CA" },
      { country: "uk", full: "en_GB", iso: "GB" },
      { country: "za", full: "en_ZA", iso: "ZA" },
      { country: "ie", full: "en_IE", iso: "IE" },
      { country: "it", full: "it_IT", iso: "IT" },
      { country: "mx", full: "es_MX", iso: "MX" },
      { country: "jp", full: "ja_JP", iso: "JP" },
      { country: "nl", full: "en_NL", iso: "NL" },
      { country: "be", full: "fr_BE", iso: "BE" },
      { country: "pe", full: "es_PE", iso: "PE" },
      { country: "se", full: "en_SE", iso: "SE" },
      { country: "th", full: "en_TH", iso: "TH" },
      { country: "bg", full: "bg_BG", iso: "BG" },
      { country: "pt", full: "pt_PT", iso: "PT" },
      { country: "cz", full: "cs_CZ", iso: "CZ" },
      { country: "no", full: "en_NO", iso: "NO" },
      { country: "ru", full: "ru_RU", iso: "RU" },
      { country: "lv", full: "en_LV", iso: "LV" },
      { country: "in", full: "en_IN", iso: "IN" },
      { country: "ch", full: "de_CH", iso: "CH" },
      { country: "at", full: "de_AT", iso: "AT" },
      { country: "my", full: "en_MY", iso: "MY" },
      { country: "id", full: "en_ID", iso: "ID" },
      { country: "sg", full: "en_SG", iso: "SG" },
      { country: "pl", full: "pl_PL", iso: "PL" },
      { country: "fi", full: "fi_FI", iso: "FI" },
      { country: "hu", full: "hu_HU", iso: "HU" },
      { country: "gr", full: "el_GR", iso: "GR" },
      { country: "tr", full: "tr_TR", iso: "TR" },
      { country: "co", full: "es_CO", iso: "CO" },
      { country: "ve", full: "es_VE", iso: "VE" },
      { country: "ph", full: "en_PH", iso: "PH" },
      { country: "ee", full: "et_EE", iso: "EE" },
      { country: "hk", full: "en_HK", iso: "HK" },
      { country: "dk", full: "en_DK", iso: "DK" },
      { country: "ro", full: "ro_RO", iso: "RO" },
      { country: "ar", full: "es_AR", iso: "AR" },
      { country: "cl", full: "es_CL", iso: "CL" },
      { country: "ec", full: "es_EC", iso: "EC" },
      { country: "es", full: "es_ES", iso: "ES" },
      { country: "lt", full: "lt_LT", iso: "LT" },
      { country: "tw", full: "zh_TW", iso: "TW" },
      { country: "fr", full: "fr_FR", iso: "FR" },
      { country: "kr", full: "ko_KR", iso: "KR" },
    ];

    let n = 0;

    for (let index = 0; index < countryList.length; index++) {
      const element = countryList[index];
      if (element.country == str.toLowerCase()) {
        n = index;
        break;
      }
    }

    this.localeMovie = countryList[n].full;
    this.localeProviders = countryList[n].country + "_" + countryList[n].iso;
  }

  formatImage(imageStr, size = "small") {
    if (size.indexOf("s") > -1) {
      // unchanged, asume person knows the "code"
    }
    if (size == "small") {
      size = "s276";
    } else if (size == "medium") {
      size = "s592";
    } else if (size == "large") {
      size = "s1920";
    }

    return this.imageUrl + imageStr.replace("{profile}", size);
  }

  score(data, priority = ["tmdb", "imdb"]) {
    const providers = { tmdb: "tmdb:score", imdb: "imdb:score" };

    for (let i = 0; i < priority.length; i++) {
      for (let j = 0; j < data.scoring.length; j++) {
        const element = data.scoring[j];
        if (element.provider_type == providers[priority[i]]) {
          return {
            name: providers[priority[i]].split(":")[0],
            value: element.value,
          };
        }
      }
    }
  }

  formatAllData(data) {
    if ("items" in data) {
      for (let i = 0; i < data.items.length; i++) {
        let item = data.items[i];

        item = this.formatData(item);
      }
    } else if ("poster" in data) { // was backdrops
      data = this.formatData(data);
    }
    return data;
  }

  formatData(item) {
    // Figure out the highest quality
    item.highestQuality = "SD";
    // set quantifier
    let q = -1;
    // create quantifier lookup
    let ql = ["sd", "hd", "4k"];
    for (let x = 0; x < item.offers.length; x++) {
      const offer = item.offers[x].presentation_type;
      const index = ql.indexOf(offer);
      if (index > q && index == 2) {
        item.highestQuality = "fourK";
        q = index;
      } else if (index > q && index == 1) {
        item.highestQuality = "HD";
        q = index;
      } else if (index > q && index == 0) {
        item.highestQuality = "SD";
        q = index;
      }
    }

    // Set the most likely popularity
    item.popularity = this.score(item);

    // Format all image urls to full path
    item.poster = this.formatImage(item.poster);

    if("backdrops" in item){
      for (let j = 0; j < item.backdrops.length; j++) {
        const backdrop = item.backdrops[j];
        backdrop.backdrop_url = this.formatImage(backdrop.backdrop_url, "large");
      }
    }
    else{
      // sometimes a movie has no backdrop
      item.backdrops = [];
    }
    

    // Figure out the best provider
    item.mainProvider = null;
    item.mainUrl = null;
    // reset
    q = -1;
    // let ql = ["SD","HD","4k"]; // reset from top
    for (let x = 0; x < item.offers.length; x++) {
      const offer = item.offers[x].presentation_type;
      const index = ql.indexOf(offer);
      if (index > q) {
        item.mainProvider = this.resolveProviderBy(item.offers[x].provider_id);
        item.mainUrl =
          "deeplink_web" in item.offers[x].urls
            ? item.offers[x].urls.deeplink_web
            : item.offers[x].urls.standard_web; // standard_web
        q = index;
      }
    }

    // create clean list of offers
    item.offersClean = this.offersClean(item);

    return item;
  }

  // WORK IN PROGRESS!!!
  // !!!!!!!!!!!!!!!!!!!
  offersClean(item) {
    let list = [];
    let ql = ["sd", "hd", "4k"];

    for (let x = 0; x < item.offers.length; x++) {
      const offer = item.offers[x];

      // search for existing
      for (let i = 0; i < list.length; i++) {
        const element = list[i];
        if (
          element.provider.id == offer.provider_id &&
          element.quality < ql.indexOf(offer.presentation_type)
        ) {
          list.push({
            provider: this.resolveProviderBy(offer.provider_id),
            quality: offer.presentation_type,
            url:
              "deeplink_web" in offer.urls
                ? offer.urls.deeplink_web
                : offer.urls.standard_web,
          });
        } else if (element.provider.id != offer.provider_id) {
          list.push({
            provider: this.resolveProviderBy(offer.provider_id),
            quality: offer.presentation_type,
            url:
              "deeplink_web" in offer.urls
                ? offer.urls.deeplink_web
                : offer.urls.standard_web,
          });
        }
      }

      if (list.length == 0) {
        list.push({
          provider: this.resolveProviderBy(offer.provider_id),
          quality: offer.presentation_type,
          url:
            "deeplink_web" in offer.urls
              ? offer.urls.deeplink_web
              : offer.urls.standard_web,
        });
      }
    }

    list = list.sort(function (obj1, obj2) {
      if (ql.indexOf(obj1.quality) < ql.indexOf(obj2.quality)) {
        return 1;
      }
      if (ql.indexOf(obj1.quality) > ql.indexOf(obj2.quality)) {
        return -1;
      }
      return 0;
    });

    return list;
  }

  resolveProviderBy(key, type = "id") {
    if (!this.providers) return null;

    for (let i = 0; i < this.providers.length; i++) {
      const element = this.providers[i];
      if (this.providers[i][type] == key) return this.providers[i];
    }
  }

  async getProviders() {
    if (this.providers != null) return this.providers;

    this.providers = [];

    let providers = await this.request("providers");

    for (let index = 0; index < providers.length; index++) {
      const element = providers[index];
      this.providers.push({
        id: element.id,
        short: element.short_name,
        name: element.clear_name,
      });
    }

    return this.providers;
  }

  async request(
    type = "popular",
    content = "all",
    fields = "all",
    providers = "all",
    media_ID = 0,
    searchString = ""
  ) {
    let providerFull = ["nfx"];
    if(this.config != null){
      providerFull = this.config.providersFull.map((item)=>item.short);
    }
    let _urlPaths = {
      providers: "providers/locale/" + this.localeProviders,
      popular: "titles/" + this.localeMovie + "/popular",
      search: "titles/" + this.localeMovie + "/popular",
      movie: "titles/movie/" + media_ID + "/locale/" + this.localeMovie,
      show: "titles/show/" + media_ID + "/locale/" + this.localeMovie,
      seasons: "titles/show_season/" + media_ID + "/locale/" + this.localeMovie,
      episodes:
        "titles/newest_episodes/" + media_ID + "/locale/" + this.localeMovie,
      none: "",
    };

    let _fields = [
      "cinema_release_date",
      "full_path",
      "full_paths",
      "id",
      "localized_release_date",
      "object_type",
      "poster",
      "scoring",
      "title",
      "tmdb_popularity",
      "backdrops",
      "production_countries",
      "offers",
      "original_release_year",
      "backdrops",
    ];

    let requestBody;
    if (type == "popular") {
      requestBody = {
        fields: _fields,
        providers: providerFull,
        enable_provider_filter: true,
        monetization_types: [],
        page: 1,
        page_size: 30,
        matching_offers_only: true,
      };

      if (content == "all") {
        requestBody.content_types = ["movie", "show"];
      } else if (["movie", "show"].indexOf(content) > -1) {
        requestBody.content_types = [content];
      }else{
        requestBody.content_types = content;
      }
    } else if (type == "search") {
      requestBody = {
        fields: _fields,
        providers: providerFull,
        enable_provider_filter: true,
        query: searchString,
        monetization_types: [],
        page: 1,
        page_size: 20,
        matching_offers_only: true,
      };

      if (content == "all") {
        requestBody.content_types = ["movie", "show"];
      } else if (["movie", "show"].indexOf(content) > -1) {
        requestBody.content_types = [content];
      }
      else{
        requestBody.content_types = content;
      }
    } else {
      requestBody = false;
    }

    let data;
    if (requestBody) {
      data = await axios.get(this.baseUrl + _urlPaths[type], {
        params: { body: JSON.stringify(requestBody) },
      });
    } else {
      data = await axios.get(this.baseUrl + _urlPaths[type]);
    }

    return this.formatAllData(data.data);
  }
}
