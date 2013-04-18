(function() {

  return {
    requests: {

      fetchRelatedQuestions: function() {
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

      fetchSearchResult: function() {
        return {
          url: this.quandora.searchUrl + '?q=' + this.quandora.query + '&l=' + 7,
          type: 'GET',
          dataType: 'JSON',
          headers: { 'Authorization': this.quandora.auth }
        };
      },

      fetchQuestion: function(uuid) {
        var queryUrl = this.quandora.domainUrl + '/m/json/q/' + uuid;
        return {
          url: queryUrl,
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

      'click .back_to_list': 'renderRelatedQuestions',

      'submit #quandora-search-form': 'performSearch',

      'click #qdr_backToRelatedQuestions': function() {
        this.renderRelatedQuestions();
      },

      //fetch question and display it
      'click .question': function(e) {
        var uuid = e.target.id;
        this.renderQuestion(uuid);
      }

    },

    handleActivate: function() {
      var domainUrl = this.domainUrl();

      this.quandora = {
        query: null, // current search query if any
        domainUrl: domainUrl,
        appUrl: this.computeAppUrl(domainUrl),
        searchUrl: this.getSearchUrl(domainUrl),
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
        this.renderRelatedQuestions();
      }
    },

    computeAppUrl: function(domainUrl) {
      var s = domainUrl.indexOf('://') + 3;
      var e = domainUrl.indexOf('.');
      var domainName = domainUrl.substring(s, e);
      var appUrl = domainUrl.substring(0, s) + 'app' + domainUrl.substring(e);
      return appUrl;
    },

    computeMltUrl: function(domainUrl) {
      var url = domainUrl;
      var kbase = this.setting('kbase');
      if (kbase) {
        url += '/m/json/kb/' + kbase + '/mlt';
      } else {
        url += '/m/json/mlt';
      }
      url += '?l=7';
      return url;
    },

    getSearchUrl: function(domainUrl) {
      return domainUrl + '/m/json/search';
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
      return 'Basic ' + Base64.encode(username + ':' + password);
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

    renderQuestion: function(uuid) {
      this.ajax('fetchQuestion', uuid)
        .done(function(response) {
          var question = response.data;
          this.switchTo('question', {'question': question, 'quandora': this.quandora});
        });
    },

    renderQuestionList: function(questions) {
      this.switchTo('list', {'questions': questions, 'quandora': this.quandora});
    },

    renderRelatedQuestions: function() {
      this.quandora.query = null;
      var questions;
      this.ajax('fetchRelatedQuestions')
      .done(function(response) {
        if (!response || response.type !== 'mlt') {
          questions = [];
        } else {
          questions = response.data.result;
        }
        this.renderQuestionList(questions);
      });
    },

    performSearch: function(event) {
      var query = event.target.elements.query.value;

      var questions = [];
      this.quandora.query = query;
      this.ajax('fetchSearchResult')
      .done(function(response) {
        if (response && response.type === 'question-search-result') {
          questions = response.data.result;
        }
        this.renderQuestionList(questions);
      });
      return false; // do not submit the form!
    }

  };

}());
