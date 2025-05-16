class Pluralize {
  static _pickRightForm(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  static has(count) {
    return this._pickRightForm(count, "has", "have");
  }

  static word(count) {
    return this._pickRightForm(count, "word", "words");
  }

  static exercise(count) {
    return this._pickRightForm(count, "exercise", "exercises");
  }

  static second(count) {
    return this._pickRightForm(count, "second", "seconds");
  }

  static minute(count) {
    return this._pickRightForm(count, "minute", "minutes");
  }

  static is(count) {
    return this._pickRightForm(count, "is", "are");
  }

  static wordExpression(count) {
    return this._pickRightForm(count, "word", "expression");
  }
}

export default Pluralize;
