(function() {

  return {
    requests: {
      fetchRelatedQuestions: function() {
        var postUrl = this.computeMltUrl();
        var auth = this.computeBasicAuth();
        var query = this.getMltQueryText();
        return {
          url: postUrl,
          type: 'POST',
          dataType: 'JSON',
          data: {
            type: 'string',
            data: query
          },
          headers: { 'Authorization': auth }
        };
      },

      fetchSearchResult: function() {
        console.log("AJAX SEARECH", this.quandora.searchUrl, this.quandora.query);
        var auth = this.computeBasicAuth();
        return {
          url: this.quandora.searchUrl+"?q="+this.quandora.query+"&l="+10,
          type: 'GET',
          dataType: 'JSON',
          headers: { 'Authorization': this.quandora.auth }
        };
      },

      fetchQuestion: function(uuid) {
        var auth = this.computeBasicAuth();
        var queryUrl = this.domainUrl() + '/m/json/q/' + uuid;
        return {
          url: queryUrl,
          type: 'GET',
          dataType: 'JSON',
          headers: { 'Authorization': auth }
        };
      }

    },

    events: {
      'app.activated': 'handleActivate',

      'click .back_to_list': 'renderRelatedQuestions',

      'submit #quandora-search-form': 'performSearch',

      'click #qdr_backToRelatedQuestions': function(e) {
        this.renderRelatedQuestions();
      },

      //fetch question and display it
      'click .question': function(e) {
        var uuid = e.target.id;
        this.renderQuestion(uuid);
      }

    },

  handleActivate: function() {
    var qdr_domainUrl = this.domainUrl();

    this.quandora = {
      query: null, // current search query if any
      domainUrl: qdr_domainUrl,
      appUrl: this.computeAppUrl(qdr_domainUrl),
      kbase: this.setting("kbase"),
      auth: this.computeBasicAuth(),
      searchUrl: this.getSearchUrl(qdr_domainUrl),
      mltUrl: null //TODOs
    };
    this.renderRelatedQuestions();
  },

  computeAppUrl: function(domainUrl) {
    var s = domainUrl.indexOf('://')+3; 
    var e = domainUrl.indexOf('.');
    var domainName = domainUrl.substring(s, e);
    var appUrl = domainUrl.substring(0, s)+"app"+domainUrl.substring(e);
    console.log("App URL", domainName, appUrl);

    return appUrl;
  },

  computeMltUrl: function() {
    var url = this.domainUrl();
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
    return domainUrl+'/m/json/search';
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
    return 'Basic ' + Base64.encode(username+':'+password);
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
        var domainUrl = this.domainUrl();
        this.switchTo('question', {'question': question, 'quandora': this.quandora});
      });
  },

  renderQuestionList: function(questions) {
    this.switchTo('list', {'questions': questions, 'quandora': this.quandora});
  },

  renderRelatedQuestions: function(questions) {
    this.quandora.query = null;
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
    var query = event.target.elements["query"].value;    

    this.quandora.query = query; 
    this.ajax('fetchSearchResult')
    .done(function(response) {      
      if (!response || response.type !== 'question-search-result') {
        questions = [];
      } else {
        questions = response.data.result;
      }
      this.renderQuestionList(questions);
    });

    return false; // do not submit the form!
  }

};

}());
