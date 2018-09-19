# react-url-state

[![Build Status](https://travis-ci.org/DennisWeiss/react-url-state.svg?branch=master)](https://travis-ci.org/DennisWeiss/react-url-state)
[![NPM](https://img.shields.io/npm/v/react-url-state.svg)](https://www.npmjs.com/package/react-url-state)
![License](https://img.shields.io/github/license/mashape/apistatus.svg)

React URL State library to set state in query string of the URL and parse it if set.

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
  /* Here you define your resolvers to map from a string in the URL to an object or any data type you like.
  They need to return promises to allow you to make asynchronous API calls. */
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
  /* Here you define mapper functions to map from the value maintained in state to a string shown in the URL. */
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
    /* call the initializeReactUrlState function in componentDidMount() 
    and assign its return value to a variable of the component */
    this.reactUrlState = initializeReactUrlState(this)(reactUrlStateOptions)
  }
	
  onChangeUser(value) {
    // call this.reactUrlState.setUrlState instead of this.setState for added functionality to set query string accordingly
    this.reactUrlState.setUrlState({user: value})
  }
	
  // some code below
}
```
