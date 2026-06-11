"use client";

import { useState } from "react";

export default function SubmitForm() {
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [line, setLine] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handlePhotoChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("please upload an image file.");
      return;
    }

    setPhoto(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!photo) {
      setError("please choose a photo first.");
      return;
    }

    if (line.trim().length === 0) {
      setError("please write one line for your moment.");
      return;
    }

    if (line.length > 120) {
      setError("your one line must be 120 characters or less.");
      return;
    }

    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    const submission = {
      photo,
      line: line.trim(),
      authorName: isAnonymous ? "" : authorName.trim(),
      isAnonymous,
      tags,
      status: "pending",
    };

    console.log("temporary submission:", submission);

    setSuccessMessage(
      "your moment has been prepared locally. backend submission comes next."
    );

    setError("");
  }

  return (
    <form className="submit-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="photo">your photo</label>

        <label className="upload-box" htmlFor="photo">
          {previewUrl ? (
            <img src={previewUrl} alt="selected preview" />
          ) : (
            <div>
              <span className="upload-icon">○</span>
              <p>tap to choose a photo</p>
              <small>or drag one in here later</small>
            </div>
          )}
        </label>

        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handlePhotoChange}
          hidden
        />
      </div>

      <div className="form-group">
        <div className="label-row">
          <label htmlFor="line">one line</label>
          <span>{line.length}/120</span>
        </div>

        <textarea
          id="line"
          name="line"
          maxLength={120}
          value={line}
          onChange={(event) => setLine(event.target.value)}
          placeholder="the moment, in your own words..."
          rows={2}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="authorName">first name or initials</label>

          <input
            id="authorName"
            name="authorName"
            type="text"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="optional"
            disabled={isAnonymous}
          />

          <small>leave blank to post anonymously</small>
        </div>

        <div className="form-group">
          <label htmlFor="tagInput">mood tags</label>

          <input
            id="tagInput"
            name="tagInput"
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="calm, exam week, walking home"
          />

          <small>separate each tag with a comma</small>
        </div>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
        />
        <span>post anonymously</span>
      </label>

      <p className="submission-note">
        all submissions are reviewed before publishing. you can request removal
        at any time — no questions asked — at{" "}
        <a href="mailto:onelineframes123@gmail.com">
          onelineframes123@gmail.com
        </a>
      </p>

      {error && <p className="form-error">{error}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      <button type="submit" className="submit-button">
        send your moment
      </button>
    </form>
  );
}