import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { describe, expect, it } from "vitest";

import { FilterSelect, FormSelect, Select, type SelectProps } from "./select";
import { SelectOptionRow } from "./select-option";

const MANY_OPTIONS = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf"];
const FEW_OPTIONS = ["alpha", "bravo", "charlie"];

function Harness({
  searchable = "auto",
  portal = false,
  Component = Select,
}: {
  searchable?: boolean | "auto";
  portal?: boolean;
  Component?: React.ComponentType<SelectProps>;
}) {
  const [value, setValue] = useState("alpha");
  return (
    <div>
      <input aria-label="before" />
      <Component
        value={value}
        onChange={setValue}
        options={MANY_OPTIONS}
        portal={portal}
        searchable={searchable}
      />
      <input aria-label="after" />
    </div>
  );
}

async function openSelect(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("combobox");
  await user.click(trigger);
  await waitFor(() => {
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
  return trigger;
}

describe("SelectOptionRow", () => {
  it("is not a tab stop", () => {
    render(
      <SelectOptionRow selected={false} onSelect={() => {}}>
        Option
      </SelectOptionRow>,
    );
    expect(screen.getByRole("option")).toHaveAttribute("tabindex", "-1");
  });
});

describe("Select combobox a11y", () => {
  it("keeps option rows and the listbox out of the tab order", async () => {
    const user = userEvent.setup();
    render(<Harness searchable={false} />);
    await openSelect(user);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("tabindex", "-1");
    for (const option of within(listbox).getAllByRole("option")) {
      expect(option).toHaveAttribute("tabindex", "-1");
    }
  });

  it("does not autofocus search and keeps it out of the tab order", async () => {
    const user = userEvent.setup();
    render(<Harness searchable="auto" />);
    const trigger = await openSelect(user);

    const search = screen.getByPlaceholderText("Buscar...");
    expect(search).toHaveAttribute("tabindex", "-1");
    expect(search).not.toHaveFocus();
    expect(trigger).toHaveFocus();
  });

  it("points aria-activedescendant at the highlighted option", async () => {
    const user = userEvent.setup();
    render(<Harness searchable={false} />);
    const trigger = await openSelect(user);

    const activeId = trigger.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    const active = document.getElementById(activeId!);
    expect(active).toHaveAttribute("role", "option");
    expect(active).toHaveAttribute("aria-selected", "true");
  });

  it("closes on Tab and moves focus to the next field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = await openSelect(user);

    await user.tab();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByLabelText("after")).toHaveFocus();
  });

  it("closes on Shift+Tab and moves focus to the previous field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = await openSelect(user);

    await user.tab({ shift: true });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByLabelText("before")).toHaveFocus();
  });

  it("closes on Escape and keeps focus on the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = await openSelect(user);

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes on outside pointerdown", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = await openSelect(user);

    await user.click(screen.getByLabelText("after"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with Enter and Space when closed", async () => {
    const user = userEvent.setup();
    render(<Select value="alpha" onChange={() => {}} options={FEW_OPTIONS} portal={false} />);
    const trigger = screen.getByRole("combobox");

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("selects the highlighted option with Enter while open", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("alpha");
      return (
        <Select value={value} onChange={setValue} options={FEW_OPTIONS} portal={false} />
      );
    }
    render(<Controlled />);
    const trigger = await openSelect(user);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("bravo");
  });
});

describe("FormSelect and FilterSelect", () => {
  it("share the Tab-to-close combobox behavior", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness Component={FormSelect} />);
    let trigger = await openSelect(user);
    await user.tab();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("after")).toHaveFocus();

    rerender(<Harness Component={FilterSelect} />);
    trigger = await openSelect(user);
    await user.tab({ shift: true });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("before")).toHaveFocus();
  });
});
