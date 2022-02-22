const deleteProduct = (btn) => {
  const parentEl = btn.closest(".product");

  const productId = btn.parentNode.querySelector('[name="productId"').value;
  const csrf = btn.parentNode.querySelector('[name="_csrf"]').value;

  fetch(`/admin/product/${productId}`, {
    method: "DELETE",
    headers: {"csrf-token": csrf},
  })
    .then((res) => res.json())
    .then(() => parentEl.remove());
};
