(function() {

  return {
    requests: {
      fetchRelatedQuestions: function() {
        var postUrl = this.computeMltQuery();
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
      'app.activated': 'renderRelatedQuestions',

      'click .back_to_list': 'renderRelatedQuestions',

      //fetch question and display it
      'click .question': function(e) {
        var uuid = e.target.id;
        this.renderQuestion(uuid);
      },

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

  computeMltQuery: function() {
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
        this.switchTo('question', {'question': question, 'domainUrl': domainUrl});
      });
  },

  renderRelatedQuestions: function(questions) {
    this.ajax('fetchRelatedQuestions')
    .done(function(response) {
      var domainUrl = this.domainUrl();
      if (!response || response.type !== 'mlt') {
        questions = [];
      } else {
        questions = response.data.result;
      }
      this.switchTo('list', {'questions': questions, 'domainUrl': domainUrl});
    });
  },

};

}());
