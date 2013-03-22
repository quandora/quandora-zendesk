(function() {

  return {
    requests: {
      fetchQuestions: function() {
        var url = this.computeQueryUrl();
        var auth = this.computeBasicAuth();
        var query = this.computeQueryText();
        return {
          'url': url,
          'data': { 'q': query },
          'type': 'GET',
          'dataType': 'json',
          'headers': { 'Authorization': auth }
        };
      }
    },

    events: {
      'app.activated': 'requestQuestions',
      'fetchQuestions.always': function(data) {
        if (!data || data.type != 'mlt') {
          data = [];          
        } else {
          data = data.data.result;
        }
        this.renderQuestions(data);
      }
    },

    getDomainUrl: function() {
      var domainUrl = this.setting("domainUrl");
      // remove trailing / if any
      var last = domainUrl.length - 1;
      if (domainUrl.indexOf('/', last) !== -1) { // ends with '/'
        domainUrl = domainUrl.substring(0, last);
      }
      return domainUrl;
    },
    
    computeBasicAuth: function() {
       var username = this.setting("username");
       var password = this.setting("password");
       return 'Basic ' + Base64.encode(username+':'+password);
    },

    computeQueryUrl: function() {
       var domainUrl = this.getDomainUrl();
       domainUrl += "/m/json/kb/88b90a69-47a8-49db-bbe8-92dcf5303001/mlt?q=bla+bla+bla";
       //TODO - remove q param (only for debug)
       return domainUrl;
    },

    computeQueryText: function() {      
      var text = "";
      var ticket = this.ticket();

      var subject = ticket.subject();
      if (subject) {
        text = subject;
      }

      var description = ticket.description();
      if (description) {
        text = text+" "+description;
      }

      var tags = ticket.tags();
      if (tags) {
        text = text + " "+tags.join(" ");
      }

      return text.trim();
    },

    requestQuestions: function() {
      console.log("REQUEST QUESTIONS!!!");
      this.ajax("fetchQuestions");
    },

    renderQuestions: function(questions) {
      var domainUrl = this.getDomainUrl();
      this.switchTo('list', {'questions': questions, 'domainUrl': domainUrl});
    }

  };

}());
