/**
 * What we test:
 *  1. Renders a "Print Receipt" button
 *  2. Clicking the button calls window.print()
 *  3. window.print() is called exactly once per click
 *  4. Multiple clicks each trigger window.print() independently
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PrintButton from "@/app/order/[orderId]/printButton";

beforeEach(() => {
  // jsdom does not implement window.print, so we mock it
  Object.defineProperty(window, "print", {
    value: jest.fn(),
    writable: true,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

// 1. Renders 
test("renders Print Receipt button", () => {
  render(<PrintButton />);
  expect(screen.getByRole("button", { name: /print receipt/i })).toBeInTheDocument();
});

// 2. Calls window.print on click 
test("calls window.print() when clicked", () => {
  render(<PrintButton />);
  fireEvent.click(screen.getByRole("button", { name: /print receipt/i }));
  expect(window.print).toHaveBeenCalled();
});

// 3. Called exactly once per click 
test("calls window.print() exactly once per click", () => {
  render(<PrintButton />);
  fireEvent.click(screen.getByRole("button", { name: /print receipt/i }));
  expect(window.print).toHaveBeenCalledTimes(1);
});

// 4. Multiple clicks each call window.print() 
test("each click triggers window.print() independently", () => {
  render(<PrintButton />);
  const btn = screen.getByRole("button", { name: /print receipt/i });
  fireEvent.click(btn);
  fireEvent.click(btn);
  fireEvent.click(btn);
  expect(window.print).toHaveBeenCalledTimes(3);
});
