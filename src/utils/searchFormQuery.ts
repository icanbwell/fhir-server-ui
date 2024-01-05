class SearchFormQuery {
  start: Date | undefined;
  end: Date | undefined;
  givenName: string | undefined;
  familyName: string | undefined;
  email: string | undefined;
  security: string | undefined;
  id: string | undefined;
  identifier: string | undefined;
  source: string | undefined;
  chatGptQuestion: string | undefined;

  constructor({
    start,
    end,
    givenName,
    familyName,
    email,
    security,
    id,
    identifier,
    source,
    chatGptQuestion,
  }: any) {
    this.start = start;
    this.end = end;
    this.givenName = givenName;
    this.familyName = familyName;
    this.email = email;
    this.security = security;
    this.id = id;
    this.identifier = identifier;
    this.source = source;
    this.chatGptQuestion = chatGptQuestion;
  }

  getQueryParameters() {
    const queryParameters = [];
    if (this.start) {
      queryParameters.push(`_lastUpdated=gt${this.start.toISOString()}`);
    }
    if (this.end) {
      queryParameters.push(`_lastUpdated=lt${this.end.toISOString()}`);
    }
    if (this.givenName) {
      queryParameters.push(`given=${this.givenName}`);
    }
    if (this.familyName) {
      queryParameters.push(`family=${this.familyName}`);
    }
    if (this.email) {
      queryParameters.push(`email=${this.email}`);
    }
    if (this.security) {
      queryParameters.push(`_security=${this.security}`);
    }
    if (this.id) {
      queryParameters.push(`id=${this.id}`);
    }
    if (this.identifier) {
      queryParameters.push(`identifier=${this.identifier}`);
    }
    if (this.source) {
      queryParameters.push(`_source=${this.source}`);
    }
    if (this.chatGptQuestion) {
      queryParameters.push(`_question=${this.chatGptQuestion}`);
    }
    return queryParameters;
  }
}

export default SearchFormQuery;
