var React = require("react");
var queryString = require("query-string");
var createHistory = require("history/createBrowserHistory");


var history = createHistory.default();

var isPrimitiveType = function (a) {
    return typeof a === 'string' || typeof a === 'number' || typeof b === 'boolean'
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
            currentState[key] = currentUrlState[key];
            delete currentUrlState[key];
            getIdResolverPromise(currentUrlState, resolvers, currentState, resolve);
        } else if (typeof resolvers[key] === "function") {
            resolvers[key](currentUrlState)
                .then(function (value) {
                    currentState[key] = value;
                    delete currentUrlState[key];
                    getIdResolverPromise(currentUrlState, resolvers, currentState, resolve)
                });
        }
    }
};

var getSearchString = function (state, toIdMappers) {
    if (Object.keys(state).length === 0) {
        return "";
    }
    return "?" + Object.keys(state)
        .map(function (key) {
            if (isPrimitiveType(state[key])) {
                return key + "=" + encodeURIComponent(state[key] != null ? state[key] : "");
            } else {
                if (toIdMappers[key] == null) {
                    throw "No id mapper provided for " + key + "! You always need to provide a mapper if the value is not a primitive data type";
                } else if (typeof toIdMappers[key] !== "function") {
                    throw "Id mapper of " + key + " has to be a function!";
                } else {
                    var value = toIdMappers[key](state[key]);
                    return key + "=" + encodeURIComponent(value != null ? value : "");
                }
            }
        })
        .join("&");
};

var convertToHistory = function (state, pathname) {
    return {
        pathname: pathname,
        search: getSearchString(state)
    };
}

var initializeReactUrlState = function (component, fromIdResolvers, toIdMappers, pathname, allowedQueryParams) {
    if (!component.prototype instanceof React.Component) {
        throw "component has to be a subclass of React.Component!";
    }

    var setUrlState = function (urlState, callback) {
        component.setState(urlState, function () {
            history.push(convertToHistory(urlState, pathname))
            if (typeof callback === "function") {
                callback();
            }
        });
    };

    var urlState = {};
    var state = {};
    Object.keys(component.state).forEach(function (key) {
        state[key] = component.state[key];
    });
    getIdResolverPromise(urlState, fromIdResolvers).then(setUrlState);

    return {
        setUrlState: setUrlState
    };
};

module.exports.initializeReactUrlState = initializeReactUrlState;