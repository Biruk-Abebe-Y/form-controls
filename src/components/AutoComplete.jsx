import React, { Component, PropTypes } from 'react';
import Select from 'react-select';
import { httpInterceptor } from 'src/helpers/httpInterceptor';
import 'src/helpers/componentStore';
import get from 'lodash/get';
import { Validator } from 'src/helpers/Validator';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';


export class AutoComplete extends Component {
  constructor(props) {
    super(props);
    this.optionsUrl = props.optionsUrl;
    this.childRef = undefined;
    this.getValueFromProps = this.getValueFromProps.bind(this);
    this.getValue = this.getValue.bind(this);
    this.getOptions = this.getOptions.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.storeChildRef = this.storeChildRef.bind(this);
    this.state = {
      value: this.getValueFromProps(props),
      hasErrors: false,
      options: [],
      noResultsText: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    const value = this.getValueFromProps(nextProps);
    const errors = this._getErrors(value);
    const hasErrors = this._hasErrors(errors);
    this.setState({ value, hasErrors });
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!isEqual(this.props.value, nextProps.value) ||
      !isEqual(this.state.value, nextState.value) ||
      this.state.hasErrors !== nextState.hasErrors ||
      this.state.options !== nextState.options ||
      this.state.noResultsText !== nextState.noResultsText) {
      return true;
    }
    return false;
  }

  componentWillUpdate(nextState) {
    return !isEqual(this.state.options, nextState.options)
      || this.state.hasErrors !== nextState.hasErrors;
  }

  componentDidUpdate() {
    const errors = this._getErrors(this.state.value);
    if (this._hasErrors(errors)) {
      this.props.onValueChange(this.state.value, errors);
    }
  }

  onInputChange(input) {
    if (input.length >= this.props.minimumInput) {
      this.setState({ options: this.props.options });
      this.setState({ noResultsText: 'No Results Found' });
      return;
    }
    this.setState({ noResultsText: 'Type to search' });
    this.setState({ options: [] });
  }

  getValueFromProps(props) {
    if (props.multi) {
      return get(props, 'value');
    }
    return get(props, 'value[0]');
  }

  getOptions(input) {
    const { optionsUrl } = this.props;
    return httpInterceptor.get(optionsUrl + input)
      .then((data) => {
        const options = data.results;
        return { options };
      }).catch(() => {
        const options = [];
        return { options };
      });
  }

  getValue() {
    if (this.state.value) {
      return this.props.multi ? this.state.value : [this.state.value];
    }
    return [];
  }

  handleChange(value) {
    const errors = this._getErrors(value);
    this.setState({ value, hasErrors: this._hasErrors(errors) });
    if (this.props.onValueChange) {
      this.props.onValueChange(value, errors);
    }
  }

  storeChildRef(ref) {
    if (ref) this.childRef = ref;
  }

  handleFocus() {
    if (this.childRef) {
      this.childRef.loadOptions('');
    }
  }

  _getErrors(value) {
    const validations = this.props.validations;
    const controlDetails = { validations, value };
    return Validator.getErrors(controlDetails);
  }

  _hasErrors(errors) {
    return !isEmpty(errors);
  }


  render() {
    const { autofocus, disabled, labelKey, valueKey,
                  asynchronous, multi, minimumInput } = this.props;
    const props = {
      autofocus,
      backspaceRemoves: false,
      disabled,
      labelKey,
      minimumInput,
      multi,
      onChange: this.handleChange,
      value: this.state.value,
      valueKey,
    };
    const className =
      classNames('obs-control-select-wrapper', { 'form-builder-error': this.state.hasErrors });
    if (asynchronous) {
      return (
        <div className={className}>
          <Select.Async
            { ...props }
            loadOptions={ this.getOptions }
            onFocus={ this.handleFocus }
            ref={this.storeChildRef}
          />
        </div>
      );
    }
    return (
      <div className={className}>
        <Select { ...props }
          noResultsText={this.state.noResultsText}
          onInputChange={this.onInputChange}
          options={ this.state.options }
        />
      </div>
    );
  }
}

AutoComplete.propTypes = {
  asynchronous: PropTypes.bool,
  autofocus: PropTypes.bool,
  disabled: PropTypes.bool,
  labelKey: PropTypes.string,
  minimumInput: PropTypes.number,
  multi: PropTypes.bool,
  onValueChange: PropTypes.func,
  options: PropTypes.array,
  optionsUrl: PropTypes.string,
  validations: PropTypes.array,
  value: PropTypes.any,
  valueKey: PropTypes.string,
};

AutoComplete.defaultProps = {
  asynchronous: true,
  autofocus: false,
  disabled: false,
  labelKey: 'display',
  minimumInput: 2,
  multi: false,
  optionsUrl: '/openmrs/ws/rest/v1/concept?v=full&q=',
  valueKey: 'uuid',
};

const descriptor = {
  control: AutoComplete,
  designProperties: {
    isTopLevelComponent: false,
  },
  metadata: {
    attributes: [
      {
        name: 'properties',
        dataType: 'complex',
        attributes: [],
      },
    ],
  },
};


window.componentStore.registerDesignerComponent('autoComplete', descriptor);

window.componentStore.registerComponent('autoComplete', AutoComplete);

