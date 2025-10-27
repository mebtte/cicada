extension FirstWhereOrNull<T> on List<T> {
  T? firstWhereOrNull(bool Function(T element) test) {
    for (T element in this) {
      if (test(element)) {
        return element;
      }
    }
    return null;
  }
}

extension SafeGet<T> on List<T> {
  T? safeGet(int index) {
    return index < 0 || index >= length ? null : this[index];
  }
}
