(function() {

  return {
    requests: {

      fetchRelatedQuestions: function() {
        this.quandora.query = null;
        var query = this.getMltQueryText();
        return {
          url: this.quandora.mltUrl,
          type: 'POST',
          dataType: 'JSON',
          data: {
            type: 'string',
            data: query
          },
          headers: { 'Authorization': this.quandora.auth }
        };
      },

      fetchSearchResult: function(query) {
        this.quandora.query = query;
        return {
          url: this.getSearchUrl(query),
          type: 'GET',
          dataType: 'JSON',
          headers: { 'Authorization': this.quandora.auth }
        };
      },

      fetchQuestion: function(uuid) {
        return {
          url: this.getQuestionUrl(uuid),
          type: 'GET',
          dataType: 'JSON',
          headers: { 'Authorization': this.quandora.auth }
        };
      }

    },

    events: {
      'app.activated': 'handleActivate',
      'ticket.subject.changed': 'loadIfReady',
      'ticket.description.changed': 'loadIfReady',
      'click .back_to_list': 'backToList',
      'submit #quandora-search-form': 'submitSearchQuery',
      'click #qdr_backToRelatedQuestions': 'openRelatedQuestions',
      'click .question-link': 'openQuestion',

      'fetchQuestion.done': 'renderQuestion',
      'fetchQuestion.fail': 'renderFailure',

      'fetchSearchResult.done': 'renderSearchResult',
      'fetchSearchResult.fail': 'renderFailure',

      'fetchRelatedQuestions.done': 'renderRelatedQuestions',
      'fetchRelatedQuestions.fail': 'renderFailure'
    },

    handleActivate: function() {
      var domainUrl = this.domainUrl();

      this.quandora = {
        query: null, // current search query if any
        domainUrl: domainUrl,
        appUrl: this.computeAppUrl(domainUrl),
        searchUrl: this.computeSearchUrl(domainUrl),
        mltUrl: this.computeMltUrl(domainUrl),
        kbase: this.setting('kbase'),
        auth: this.computeBasicAuth(domainUrl)
      };

      this.doneLoading = false;
      this.loadIfReady();
    },

    loadIfReady: function() {
      var ticket = this.ticket();
      if (!this.doneLoading && ticket && ticket.subject()) {
        this.doneLoading = true;
        this.openRelatedQuestions();
      }
    },

    domainUrl: function() {
      var url = this.setting('domainUrl');
      // remove trailing / if any
      var last = url.length - 1;
      if (url.indexOf('/', last) !== -1) { // ends with '/'
        url = url.substring(0, last);
      }
      return url;
    },

    computeBasicAuth: function() {
      var username = this.setting('username');
      var password = this.setting('password');
      var auth = Base64.encode(username + ':' + password);
      return 'Basic ' + auth;
    },

    /**
     * Compute the normalized app URL. Parse an URL of the form:
     * https://{client}.quandora.com or http://{client}.dev.quandora.com and replace {client} with 'app'.
     */
    computeAppUrl: function(domainUrl) {
      var s = domainUrl.indexOf('://') + 3;
      var e = domainUrl.indexOf('.');
      var domainName = domainUrl.substring(s, e);
      var appUrl = domainUrl.substring(0, s) + 'app' + domainUrl.substring(e);
      return appUrl;
    },

    computeMltUrl: function(domainUrl) {
      var kbase = this.setting('kbase');
      return kbase ? this.computeBaseMltUrl(domainUrl, kbase) : this.computeDomainMltUrl(domainUrl);
    },

    computeDomainMltUrl: function(domainUrl) {
        return domainUrl + '/m/json/mlt?l=7';
    },

    computeBaseMltUrl: function(domainUrl, kbase) {
        return domainUrl + '/m/json/kb/' + kbase + '/mlt?l=7';
    },

    computeSearchUrl: function(domainUrl) {
      return domainUrl + '/m/json/search';
    },

    getSearchUrl: function(query) {
      return this.quandora.searchUrl + '?q=' + query + '&l=' + 7;
    },

    getQuestionUrl: function(uuid) {
        return this.quandora.domainUrl + '/m/json/q/' + uuid;
    },

    getMltQueryText: function() {
      var text = '';
      var ticket = this.ticket();

      var subject = ticket.subject();
      if (subject) {
        text = subject;
      }

      var description = ticket.description();
      if (description) {
        text = text + ' ' + description;
      }

      var tags = ticket.tags();
      if (tags) {
        text = text + ' ' + tags.join(' ');
      }
      return text.trim();
    },

    computeQueryJsonMessage: function() {
      return JSON.stringify({type: 'string', data: this.getMltQueryText()});
    },

    /* ---- Failure rendering -- */

    renderFailure: function(response, a, b) {
        this.switchTo('error', { 'response': response, 'quandora': this.quandora });
    },

    /* ----  Question rendering ---- */

    renderQuestion: function(response) {
        var question = response.data;
        this.switchTo('question', { 'question': question, 'quandora': this.quandora });
    },

    openQuestion: function(e) {
        var uuid = e.target.id;
        this.ajax('fetchQuestion', uuid);
    },

    /* ----  Question List rendering ---- */

    renderQuestionList: function(questions) {
      this.switchTo('list', {'questions': questions, 'quandora': this.quandora});
    },

    backToList: function() {
      if (this.quandora.query) {
          // if the query is defined go back to search
          this.ajax('fetchSearchResult', this.quandora.query);
      } else {
          // otherwise go back to related questions
          this.openRelatedQuestions();
      }
    },

    openRelatedQuestions: function() {
      this.ajax('fetchRelatedQuestions');
    },

    renderRelatedQuestions: function(response) {
      // remove the stored query if any
      this.quandora.query = null;
      var questions;
      if (!response || response.type !== 'mlt') {
        questions = [];
      } else {
        questions = response.data.result;
      }
      // render question list
      this.renderQuestionList(questions);
    },

    submitSearchQuery: function(event) {
      this.ajax('fetchSearchResult', event.target.elements.query.value);
      return false; // do not submit the form!
    },

    renderSearchResult: function(response) {
      var questions = [];
      if (response && response.type === 'question-search-result') {
        questions = response.data.result;
      }
      this.renderQuestionList(questions);
    }

  };

}());
