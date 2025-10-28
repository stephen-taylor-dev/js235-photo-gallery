"use strict";
import templates from "./templates.js"

class App {
  constructor() {
    this.slides = document.getElementById('slides');
    this.commentsDiv = document.querySelector('#comments ul');
    this.nextButton = document.querySelector('.next');
    this.prevButton = document.querySelector('.prev');
    this.photoInfoContainer = document.querySelector('#information');
    this.commentForm = document.querySelector('form');
    
    this.currentPhotoIdx = 0; // Set to first one
    this.photos = null;
    this.comments = null;

    this.nextButton.addEventListener('click', this.transitionPhotoHandler.bind(this));
    this.prevButton.addEventListener('click', this.transitionPhotoHandler.bind(this));
    this.photoInfoContainer.addEventListener('click', this.handleActionClick.bind(this));
    this.commentForm.addEventListener('submit', this.handleFormSubmission.bind(this));
  }

  async main() {
    await this.fetchPhotos();
    this.renderPhotos();
    this.slides.children[0].className = 'active';
    
    this.renderPhotoInformation(this.photos[0].id);
    await this.fetchComments(this.photos[0].id);
    this.renderComments();
  }

  async fetchPhotos() {
    let response = await fetch('/photos');
    this.photos = await response.json();
  }

  renderPhotos() {
    this.slides.innerHTML = templates.photos(this.photos);
  }

  renderPhotoInformation(idx) {
    let photo = this.photos.find(photo => photo.id === idx);
    let header = document.getElementById('information');
    header.innerHTML = templates.photoInformation(photo);
  }

  async fetchComments(photoId) {
    let response = await fetch(`/comments?photo_id=${photoId}`);
    this.comments = await response.json();
  }

  renderComments() {
    this.commentsDiv.innerHTML = '';
    let commentsHTML = templates.comments(this.comments);
    this.commentsDiv.innerHTML = commentsHTML;
  }

  renderComment(data) {
    let commentHTML = templates.comment(data);
    this.commentsDiv.insertAdjacentHTML('beforeend', commentHTML);
  }

  async transitionPhotoHandler(event) {
    this.slides.children[this.currentPhotoIdx].className = 'hidden';
    let direction = event.target.className === 'next' ? 1 : -1;
    this.currentPhotoIdx = this.processIndexLoop(this.currentPhotoIdx + direction);
    this.slides.children[this.currentPhotoIdx].className = 'active';

    this.renderPhotoInformation(this.currentPhotoIdx + 1);
    await this.fetchComments(this.currentPhotoIdx + 1);
    this.renderComments()
  }

  async handleActionClick(event) {
    event.preventDefault();
    let button = event.target
    let path = button.getAttribute('href');
    let buttonType = button.getAttribute('data-property');
    if (!buttonType) return;

    let data = {'photo_id': Number(event.target.dataset.id)}
    let json = JSON.stringify(data);

    let response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      }, 
      body: json,
    });

    if (response.status === 200) {
      let data = await response.json();
      event.target.querySelector('span').innerHTML = data.total;
    }
  }

  async handleFormSubmission(event) {
    event.preventDefault();
    const form = event.target;
    let path = form.getAttribute('action');

    let dataInputs = [...form.elements].reduce((keyValuePairs, element) => {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        let key = encodeURIComponent(element.name);
        let value = encodeURIComponent(element.value);
        keyValuePairs.push(`${key}=${value}`);
      }

      return keyValuePairs;
    }, []);

    let data = dataInputs.join('&');

    let response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    });

    if (response.status === 200) {
      let json = await response.json();
      form.reset();
      this.renderComment(json);
    }
  }
  
  // Helper 
  processIndexLoop(idx) {
    if (idx >= this.photos.length) {
      idx = 0 // loop to the first one
    } else if (idx < 0) { 
      idx = this.photos.length - 1; // loop to the last one
    }

    return idx;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.main();
});
