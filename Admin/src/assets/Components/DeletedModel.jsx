
import React, { useState } from "react";

const DeletedModel = ({show,onClose,onConfirm}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800">
          Delete Confirmation
        </h2>

        <p className="mt-3 text-gray-600">
          Are you sure you want to delete this student?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletedModel;
