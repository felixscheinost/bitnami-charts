/*
 * Copyright VMware, Inc.
 * SPDX-License-Identifier: APACHE-2.0
 */

/// <reference types="cypress" />
import { random } from '../support/utils';

it('allows to create a new website', () => {
  cy.login();
  cy.visit('/index.php?module=SitesManager&showaddsite=1');
  // We need to use the title attribute because with the inner HTML we cannot differentiate
  // between "website" and "intranet website"
  cy.get('[title*="A website"]').click();
  cy.fixture('websites').then((sites) => {
    // The name input has no attribute "name" or "id"
    cy.get('[placeholder="Name"]').type(`${sites.newSite.name} ${random}`, {
      force: true,
    });
    cy.get('[name="urls"]').type(`${sites.newSite.url}`, {
      force: true,
    });
  });
  cy.get('[type="submit"]').click();
  cy.contains('Website created');
});

// The Matomo API allows checking the site analytics and tracking metrics
// Source: https://matomo.org/guide/apis/analytics-api/
it('allows to use the API to retrieve analytics', () => {
  // Record a new visit in order to generate analytics beforehand
  cy.request('/matomo.php?idsite=1&rec=1').then((response) => {
    expect(response.status).to.eq(200);
  });

  cy.login();
  // Navitage using the UI as Matomo will randomly fail with
  // "token mismatch" if accessed directly
  cy.get('#topmenu-coreadminhome').click();
  cy.contains('Personal').click();
  cy.contains('Security').click();
  cy.contains('Create new token').click();
  cy.get('#login_form_password').type(Cypress.env('password'));
  cy.get('[type="submit"]').click();
  cy.get('#description').type(random);
  cy.get('input[id="secure_only"]').click({ force: true });
  cy.get('[type="submit"]').click();
  cy.contains('Token successfully generated');
  cy.get('code')
    .invoke('text')
    .then((apiToken) => {
      cy.request({
        url: '/index.php',
        method: 'GET',
        qs: {
          module: 'API',
          method: 'Live.getLastVisitsDetails',
          idSite: 1,
          format: 'JSON',
          token_auth: apiToken,
        },
      }).then((response) => {
        const bodyString = JSON.stringify(response.body);
        expect(response.status).to.eq(200);
        expect(bodyString).to.contain('visitIp');
      });
    });
});
