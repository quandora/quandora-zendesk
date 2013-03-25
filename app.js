'use strict';

(function() {

  return {
    requests: {
      fetchQuestions: function() {
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
      }
    },

    events: {
      'app.activated': 'requestQuestions',
      'fetchQuestions.always': function(data) {
        if (!data || data.type !== 'mlt') {
          data = [];
        } else {
          data = data.data.result;
        }
        this.renderQuestions(data);
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

    requestQuestions: function() {
      this.ajax('fetchQuestions');
    },

    renderQuestions: function(questions) {
      var domainUrl = this.domainUrl();
      this.switchTo('list', {'questions': questions, 'domainUrl': domainUrl});
    }

  };

}());
