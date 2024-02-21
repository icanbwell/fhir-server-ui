class SearchFormQuery {
    params: any;
    start: Date | undefined;
    end: Date | undefined;
    chatGptQuestion: string | undefined;
    resourceType: string | undefined;

    constructor({
        start,
        end,
        chatGptQuestion,
        resourceType,
        ...params
    }: {
        start?: Date | undefined;
        end?: Date | undefined;
        chatGptQuestion?: string | undefined;
        resourceType?: string | undefined;
        params?: any;
    }) {
        this.start = start;
        this.end = end;
        this.chatGptQuestion = chatGptQuestion;
        this.resourceType = resourceType;
        this.params = params;
    }

    getQueryParameters() {
        const queryParameters = [];
        if (this.start) {
            if (this.resourceType === 'AuditEvent') {
                queryParameters.push(`date=gt${this.start.toISOString().split('T')[0]}`);
            } else {
                queryParameters.push(`_lastUpdated=gt${this.start.toISOString().split('T')[0]}`);
            }
        }
        if (this.end) {
            if (this.resourceType === 'AuditEvent') {
                queryParameters.push(`date=lt${this.end.toISOString().split('T')[0]}`);
            } else {
                queryParameters.push(`_lastUpdated=lt${this.end.toISOString().split('T')[0]}`);
            }
        }
        if (this.chatGptQuestion) {
            queryParameters.push(`_question=${this.chatGptQuestion}`);
        }
        if (this.params) {
            Object.entries(this.params).forEach(
                ([name, value]) => value && queryParameters.push(`${name}=${value}`)
            );
        }
        return queryParameters;
    }
}

export default SearchFormQuery;
