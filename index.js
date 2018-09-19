var createHistory = require('history/createBrowserHistory').default();
var Promise = require('promise-polyfill').default();

var queryString = require('./query-string');


var history = createHistory();

var isPrimitiveType = function (a) {
    return typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean';
};

var getIdResolverPromise = function (urlState, resolvers, state, resolve) {
    if (state == null) {
        state = {};
    }
    if (resolve == null) {
        return new Promise(function (resolve) {
            return getIdResolverPromise(urlState, resolvers, state, resolve);
        });
    }
    var currentState = Object.assign({}, state);
    var currentUrlState = Object.assign({}, urlState);
    if (Object.keys(currentUrlState).length === 0) {
        resolve(currentState);
    } else {
        var key = Object.keys(currentUrlState)[0];
        if (resolvers[key] == null) {
            delete currentUrlState[key];
            getIdResolverPromise(currentUrlState, resolvers, currentState, resolve);
        } else if (typeof resolvers[key] === 'function') {
            resolvers[key](currentUrlState[key])
                .then(function (value) {
                    currentState[key] = value;
                    delete currentUrlState[key];
                    getIdResolverPromise(currentUrlState, resolvers, currentState, resolve);
                });
        }
    }
};

var getSearchString = function (state, toIdMappers) {
    if (Object.keys(state).length === 0) {
        return '';
    }
    return '?' + Object.keys(state)
        .map(function (key) {
            if (isPrimitiveType(state[key])) {
                return key + '=' + encodeURIComponent(state[key] != null ? state[key] : '');
            } else {
                if (toIdMappers[key] == null) {
                    throw 'No id mapper provided for ' + key +
                    '! You always need to provide a mapper if the value is not a primitive data type';
                } else if (typeof toIdMappers[key] !== 'function') {
                    throw 'Id mapper of ' + key + ' has to be a function!';
                } else {
                    var value = toIdMappers[key](state[key]);
                    return key + '=' + encodeURIComponent(value != null ? value : '');
                }
            }
        })
        .join('&');
};

var convertToHistory = function (state, pathname, toIdMappers) {
    return {
        pathname: pathname,
        search: getSearchString(state, toIdMappers)
    };
};

var initializeReactUrlState = function (options) {
    if (this == null) {
        throw 'the React component instance has to be bound to the initializeReactURlState function. ' +
        'You achieve this by using .bind(this) or arrow functions introduced in ES6';
    }

    var setUrlState = function (urlState, callback) {
        this.setState(urlState, function () {
            history.push(convertToHistory(urlState, options.pathname, options.toIdMappers));
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    var urlState = Object.assign({}, queryString.parse(history.location.search));
    var state = {};
    Object.keys(this.state).forEach(function (key) {
        state[key] = this.state[key];
    });
    getIdResolverPromise(urlState, options.fromIdResolvers).then(setUrlState);

    return {
        setUrlState: setUrlState
    };
};


module.exports.initializeReactUrlState = initializeReactUrlState;