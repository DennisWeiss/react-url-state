# react-url-state

[![Build Status](https://travis-ci.org/DennisWeiss/react-url-state.svg?branch=master)](https://travis-ci.org/DennisWeiss/react-url-state)
[![NPM](https://img.shields.io/npm/v/react-url-state.svg)](https://www.npmjs.com/package/react-url-state)
![License](https://img.shields.io/github/license/mashape/apistatus.svg)

react-url-state is a library to set state in query string of the URL and parse it if set.

## Installation

```
$ npm i react-url-state
```

## Example Usage

```js
import React from 'react'
import {initializeReactUrlState} from 'react-url-state'

// This object contains all the configuration needed.
const reactUrlStateOptions = {
  /* Here you define your resolvers to map from a string in 
  the URL to an object or any data type you like. They need to 
  return promises to allow you to make asynchronous API calls. */
  fromIdResolvers: {
    user: id => new Promise((resolve, reject) => {
      axios
        .get('your API URL', {
          params: {
            id: id
          }
        })
        .then(res => {
          resolve(res.data)
         })
        .catch(reject)
    })
  },
  /* Here you define mapper functions to map from the value 
  maintained in state to a string shown in the URL. */
  toIdMappers: {
    user: user => user.id
  },
  pathname: 'your path name'
}

export default class YourComponent extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      user: {}
    }
  }
	
  // some code between
	
  componentDidMount() {
    /* call the initializeReactUrlState function in 
    componentDidMount() and assign its return value to a 
    variable of the component */
    this.reactUrlState = initializeReactUrlState(this)(reactUrlStateOptions)
  }
	
  onChangeUser(value) {
    /* call this.reactUrlState.setUrlState instead of 
    this.setState for added functionality to set query string 
    accordingly */
    this.reactUrlState.setUrlState({user: value})
  }
	
  // some code below
}
```

## Documentation

### Import 

The `initializeReactUrlState` function is your starting point, therefore you have to import it like so:

```js
import {initializeReactUrlState} from 'react-url-state'
```

### initializeReactUrlState(*context*)(*options*)

This function has to be called inside `componentDidMount()`. It returns an object containing the `setUrlState` function.
You need to save that reference to a variable of the component to access it later.

__Example__:

```js
componentDidMount() {
  this.reactUrlState = initializeReactUrlState(this)(reactUrlStateOptions)
}
```

#### *context*

Here you need to pass the reference of your react component. Calling the `initializeReactUrlState` function inside 
`componentDidMount()` you do this by passing in `this`.

#### *options*

This argument contains all your configuration needed. It needs to have the following keys:

##### *fromIdResolvers*

These resolvers enable you to map from a query string parameter to something that is stored in your component's state.

This *options* property has to be an object mapping from keys with names identical to the keys of your component's state and the 
query string parameters to resolvers taking the query string argument as parameter and returning a promise resolving the 
desired output. If you have an id of a data object as query string argument you might want to map to a complex object 
containing that data object.

With the key `data` you would have something like:

```js
this.state = {
  data: {
    id: '123',
    // much more fields containing data
  }
}
```

and the URL:

```
http://YOUR_URL/page?data=123
```

The reason for them needing to return promises is to allow you to make asynchronous API calls to get your data.
Of course you aren't forced to do something asynchronous in here. You could also simply do something like:

```js
const options = {
  fromIdResolvers: {
    id: id => new Promise((resolve, reject) => resolve(id))
  }
}

```

Depending on your use case you might just want to store an id itself in the component's state.

Note that the values in `this.state` get overwritten once the query string parameters have been resolved, but the values 
set initially in `this.state` act as default values. Furthermore all keys that don't have a defined resolver but are given 
in the URL will just be ignored.

#### *toIdMappers*

These function map from your complex data object to a simple string that is then set as query argument.

The functions defined here should act as the inverse functions of the resolvers defined in `fromIdResolvers`.

If omitted the identity function `x => x` is used instead. This only works for primitive data types 
(`number`, `string` and `boolean`).

__Example__:

```js
const options = {
  toIdMappers: {
    data: data => data.id
  }
}
```

They are just normal functions. There is no need for promises here since your data object should already contain 
something like an id.

#### *pathname*

The pathname of your component is defined here. If the page is at `YOUR_APPS_ROOT/main/my_page` you define:

```js
const options = {
  pathname: '/main/my_page'
}
```

### .setReactUrlState(*urlState*, *[callback]*)

This function is called on the reference that has been returned by `initializeReactUrlState`.

It works analogous to the `setState` function from React. Pass in an object containing all the keys that are supposed to 
be represented in the query string. The `toIdMappers` you have defined previously do the rest now.
For all others keys call the `setState` function from React like you would usually do.
