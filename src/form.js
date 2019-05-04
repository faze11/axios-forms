export default class Form {
    /**
     * Create a new Form instance.
     *
     * @param {object} data Initial from data object.
     * @param {object} config Form configuration object.
     * @constructor
     */
    constructor(data, config = {}) {
        let cloneData = config.raw ? data : JSON.parse(JSON.stringify(data));
        this.originalData = config.raw ? data : JSON.parse(JSON.stringify(data));

        for (let field in cloneData) {
            this[field] = cloneData[field];
        }

        this.handler = config.handler;
        this.resetOnSuccess = config.resetOnSuccess ? true : false;
        this.alertOnSuccess = config.alertOnSuccess ? true : false;
        this.alertOnError = config.alertOnError ? true : false;

        this.errorMods = 0;
        this.busy = false;
    }

    /**
     * Reset the from and fill it with the given data.
     *
     * @param {Object} data
     * @param {boolean} raw
     * @return {undefined}
     */
    fill(data, raw = false) {
        let cloneData = raw ? data : JSON.parse(JSON.stringify(data));
        this.reset();
        this.originalData = raw ? data : JSON.parse(JSON.stringify(data));
        for (let field in cloneData) {
            this[field] = cloneData[field];
        }
    }

    /**
     * Update the data in the form with the given values.
     *
     * @param {Object} data
     * @param {boolean} raw
     * @return {undefined}
     */
    update(data, raw = false) {
        let cloneData = raw ? data : JSON.parse(JSON.stringify(data));
        for (let field in this.originalData) {
            this[field] = cloneData[field];
        }
    }

    /**
     * Fetch the relevant data object from the form.  Returns
     * a FormData object when multiple is true.
     *
     * @param {boolean} multipart
     * return {FormData|Object}
     */
    data(multipart = false) {
        if (multipart) {
            let data = new FormData();

            for (let property in this.originalData) {
                data.append(property, this[property]);
            }

            return data;
        }

        let data = {};
        for (let property in this.originalData) {
            data[property] = this[property];
        }

        return data;
    }

    /**
     * Check if a field has been modified, or check the
     * entire form by excluding the field paramter.
     *
     * @param {string} field
     * @return {boolean}
     */
    isDirty(field = null) {
        if (field) {
            return (this[field] != this.originalData[field]);
        }

        for (let property in this.originalData) {
            if (this[property] != this.originalData[property]) {
                console.log('dirty prop: ' + property);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Reset the form fields and clear all errors.
     *
     * @return {undefined}
     */
    reset() {
        for (let field in this.originalData) {
            this[field] = '';
        }

        this.clearError();
    }

    /**
     * Send a POST request to the given URL.
     * .
     * @param {string} url
     * @return {Promise}
     */
    post(url) {
        return this.submit('post', url);
    }

    /**
     * Send a PUT request to the given URL.
     * .
     * @param {string} url
     * @return {Promise}
     */
    put(url) {
        return this.submit('put', url);
    }

    /**
     * Send a PATCH request to the given URL.
     * .
     * @param {string} url
     * @return {Promise}
     */
    patch(url) {
        return this.submit('patch', url);
    }

    /**
     * Send a DELETE request to the given URL.
     *
     * @param {string} url
     * @return {Promise}
     */
    delete(url) {
        return this.submit('delete', url);
    }

    /**
     * Send a GET request to the given URL.  Converts data
     * properties to the query string.
     * .
     * @param {string} url
     * @return {Promise}
     */
    get(url) {
        return this.submit('get', this.toQueryString(url));
    }

    /**
     * Submit the form with Axios.
     *
     * @param {string} method
     * @param {string} url
     * @return {Promise}
     */
    submit(method, url, multipart = false) {
        this.busy = true;
        return new Promise((resolve, reject) => {
            axios[method](url, this.data(multipart))
                .then(response => {
                    if (this.handler) {
                        this.handler.handleResponse(response, this.alertOnSuccess);
                    }
                    if (this.resetOnSuccess) {
                        this.reset();
                    }
                    resolve(response);
                })
                .catch(error => {
                    if (this.handler) {
                        this.handler.handleError(error, this.alertOnError);
                    }
                    reject(error);
                })
                .finally(() => {
                    this.busy = false;
                });
        });
    }

    /**
     * Check if an error exists for the field, or the entire
     * form when the field parameter is null.
     *
     * @param {string} field
     * @return {boolean}
     */
    hasError(field = null) {
        if (this.handler) {
            return this.handler.hasFormError(field);
        }
        return false;
    }

    /**
     * Get the error message for the field, or the first available
     * field if field is null.
     *
     * @param {string} field
     * @return {null|string}
     */
    getError(field = null) {
        if (this.handler) {
            return this.handler.getFormError(field);
        }

        return null;
    }

    /**
     * Clear out errors for the field, or all fields if the field
     * parameter is null.
     *
     * @param {string} field
     * @return {undefined}
     */
    clearError(field = null) {
        if (this.handler) {
            this.handler.clearFormError(field);
            this.errorMods++;
        }
    }

    /**
     * Add an error to the field.
     *
     * @param {string} field
     * @param {string} message
     * @return {undefined}
     */
    addError(field, message) {
        if (this.handler) {
            this.handler.addFormError(field, message);
            this.errorMods++;
        }
    }

    /**
     * Combine the contents of another form into this form so
     * the data can be submitted together in one request.
     *
     * @param {Form} otherForm
     * @return {undefined}
     */
    combineForm(otherForm) {
        for (let property in otherForm.originalData) {
            this.originalData[property] = otherForm.originalData[property];
            this[property] = otherForm[property];
        }
    }

    /**
     * Convert the form data into a query string for get requests.
     *
     * @param {string} url
     * @return {string}
     */
    toQueryString(url = '') {
        const data = this.data();
        for(let field in data) {
            let value = encodeURIComponent(data[field]);
            url += (url.includes('?')) ? `&${field}=${value}` : `?${field}=${value}`;
        }
        return url;
    }
}
