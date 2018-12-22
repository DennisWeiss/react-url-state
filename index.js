'use strict';

var createHistory = require('history/createBrowserHistory').default;
var queryString = require('./query-string');


var history = createHistory();

var isPrimitiveType = function (a) {
  return typeof a === 'string' || typeof a === 'number' || typeof a === 'boolean';
};

var getIdResolverPromise = function (urlState, resolvers, state, resolve, index=0) {
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
  if (Object.keys(currentUrlState).length <= index) {
    resolve(currentState);
  } else {
    var key = Object.keys(currentUrlState)[index];
    if (resolvers[key] == null) {
      getIdResolverPromise(currentUrlState, resolvers, currentState, resolve, index + 1);
    } else if (typeof resolvers[key] === 'function') {
      resolvers[key](currentUrlState[key])
        .then(function (value) {
          currentState[key] = value;
          getIdResolverPromise(currentUrlState, resolvers, currentState, resolve, index + 1);
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
      if (toIdMappers[key] == null) {
        if (isPrimitiveType(state[key])) {
          return key + '=' + encodeURIComponent(state[key] != null ? state[key] : '');
        } else {
          throw 'No id mapper provided for ' + key +
          '! You always need to provide a mapper if the value is not a primitive data type';
        }
      } else if (typeof toIdMappers[key] !== 'function') {
        throw 'Id mapper of ' + key + ' has to be a function!';
      } else {
        var value = toIdMappers[key](state[key]);
        return key + '=' + encodeURIComponent(value != null ? value : '');
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

var getCombinedUrlState = function (previousState, newUrlState) {
  const combinedUrlState = Object.assign({}, previousState)
  Object.keys(newUrlState).forEach(function (key) {
    combinedUrlState[key] = newUrlState[key]
  })
  return combinedUrlState
}

var initializedReactUrlState = function (options) {
  var context = this;
  if (options == null) {
    throw 'No options defined in initializeReactUrlState! ' +
    'You have to call the function by using currying like so: initializeReactUrlState(this)(options)';
  }

  if (options.fromIdResolvers == null) {
    options.fromIdResolvers = {};
  }

  if (options.toIdMappers == null) {
    options.toIdMappers = {};
  }

  var setUrlState = function (urlState, callback) {
    console.log('settting state', urlState)
    context.setState(urlState, function () {
      var urlStateWithPreviousState = getCombinedUrlState(queryString.parse(history.location.search), urlState)
      history.push(convertToHistory(urlStateWithPreviousState, options.pathname, options.toIdMappers));
      if (typeof callback === 'function') {
        callback.apply(context);
      }
    });
  };

  var urlState = Object.assign({}, queryString.parse(history.location.search));
  var state = {};
  Object.keys(context.state).forEach(function (key) {
    state[key] = context.state[key];
  });

  console.log('id resolver promises')
  getIdResolverPromise(urlState, options.fromIdResolvers).then(setUrlState);

  return {
    setUrlState: setUrlState
  };
};

var initializeReactUrlState = function (context) {
  return initializedReactUrlState.bind(context);
};


module.exports.initializeReactUrlState = initializeReactUrlState;