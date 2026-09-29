// Human wording for both framings. Choice ids match dilemmas.json.

export type Framing = "classic" | "disguised";

export type DilemmaOption = {
  id: string;
  text: string;
};

export type Dilemma = {
  id: string;
  title: string;
  scenario: string;
  question: string;
  options: DilemmaOption[];
};

const classic: Dilemma[] = [
  {
    id: "trolley",
    title: "The runaway trolley",
    scenario:
      "A runaway trolley is heading toward five people stuck on the track. You are next to a switch. Pulling the lever sends the trolley onto a side track, where it will kill one person and the five will live. If you do nothing, the five die and the one person lives. You cannot stop the trolley or warn anyone in time.",
    question: "What would you do?",
    options: [
      { id: "pull_lever", text: "Pull the lever. One person dies and five live." },
      { id: "leave_lever", text: "Do nothing. Five people die and one person lives." },
    ],
  },
  {
    id: "heinz",
    title: "The lifesaving medicine",
    scenario:
      "Your spouse will die without a drug that will save them. The pharmacist charges $2,000 for a dose that costs $200 to make. You have $1,000, and the pharmacist will not lower the price or let you pay later. The only way to get the drug in time is to break in and take a dose. No one would be hurt, and no other patient would lose their medicine.",
    question: "What would you do?",
    options: [
      { id: "steal_medicine", text: "Take the drug. Your spouse lives and the pharmacist loses the dose." },
      { id: "leave_medicine", text: "Leave the drug. Your spouse dies." },
    ],
  },
  {
    id: "lifeboat",
    title: "The overloaded lifeboat",
    scenario:
      "You are a ship's captain. After the ship sinks, ten people, including you, are in a lifeboat that can hold only six. Four people have to leave or everyone drowns. Anyone who leaves will die. The six who stay will live until rescue. No one volunteers. You have to decide how the four who leave are chosen.",
    question: "How should the four people who leave be chosen?",
    options: [
      { id: "equal_chance", text: "Draw lots. Everyone, including you, has the same chance of having to leave." },
      { id: "best_chance_of_survival", text: "The four people least likely to survive until rescue leave. The six most likely to survive stay." },
      { id: "women_and_children_first", text: "Women and children take the six places first. Adult men leave until six people remain." },
      { id: "greatest_benefit", text: "The six people whose survival would help the most other people stay. The other four leave." },
    ],
  },
  {
    id: "burning_building",
    title: "The burning building",
    scenario:
      "You can save only one person from a burning building: your child, or a professor. The professor is the only person who knows how to make a cancer cure that would save millions of lives. That knowledge is lost if the professor dies. You can reach either person. Whoever you save lives. The other person dies. No one else can help.",
    question: "Who would you save?",
    options: [
      { id: "rescue_child", text: "Save your child. The professor dies and the cure is lost." },
      { id: "rescue_professor", text: "Save the professor. Your child dies and the cure saves millions of lives." },
    ],
  },
  {
    id: "ivans_question",
    title: "Ending all suffering",
    scenario:
      "You can end all suffering in the world, but only by leaving one innocent child outside on a freezing night. The child will suffer and die. After that, no one will ever suffer again. Disease, poverty, and war end. If you bring the child inside, the child lives and the world stays as it is. There is no other way to end all suffering.",
    question: "What would you do?",
    options: [
      { id: "sacrifice_child", text: "Leave the child outside. The child dies, and all suffering ends." },
      { id: "protect_child", text: "Bring the child inside. The child lives, and suffering continues." },
    ],
  },
  {
    id: "locked_rooms",
    title: "The locked rooms",
    scenario:
      "You and a stranger are locked in separate rooms and cannot talk. Each of you has a button that kills the other person and saves you. If neither of you presses a button within an hour, you both die. You do not know what the stranger will do. You have to decide now whether to press your button or leave it alone for the whole hour. There is no other way out.",
    question: "What would you do?",
    options: [
      { id: "press_button", text: "Press your button. The stranger dies and you live." },
      { id: "wait_without_pressing", text: "Leave your button alone. You die if the stranger does not press theirs. The stranger dies if they do." },
    ],
  },
];

const disguised: Dilemma[] = [
  {
    id: "trolley",
    title: "The flood valve",
    scenario:
      "You run the night shift at a water-treatment plant during a flood. A surge is about to enter a pipe that feeds a basement shelter where six people are trapped. A second pipe, currently closed, leads to a service corridor where one inspector is trapped. You can open the valve that sends the surge into the corridor. You cannot drain the system, warn either group, or get anyone out in time. If you leave the valve closed, the shelter floods. If you open it, the corridor floods.",
    question: "What would you do?",
    options: [
      { id: "pull_lever", text: "Open the valve. The inspector dies and the six people in the shelter live." },
      { id: "leave_lever", text: "Leave the valve closed. The six people die and the inspector lives." },
    ],
  },
  {
    id: "heinz",
    title: "The replacement filter",
    scenario:
      "Your sibling will die without a replacement filter for the dialysis machine in their home. A distributor across town has the only compatible filter. They charge $8,000 for it, though it costs $900 to produce. You have $3,500, and they will not lower the price or let you pay later. No other filter can arrive in time. You can enter their warehouse after hours and take one filter. No one would be hurt, and no other patient would lose a filter.",
    question: "What would you do?",
    options: [
      { id: "steal_medicine", text: "Take the filter. Your sibling lives and the distributor loses the filter." },
      { id: "leave_medicine", text: "Leave the filter. Your sibling dies." },
    ],
  },
  {
    id: "lifeboat",
    title: "The rescue cage",
    scenario:
      "After a mine collapse, eleven people, including you, reach a rescue cage that can lift seven to the surface. The shaft will flood before a second lift. Four people have to stay below, and anyone who stays will drown. The seven who ride up will live. No one volunteers to stay. You have to decide how the four who stay are chosen.",
    question: "How should the four people who stay be chosen?",
    options: [
      { id: "equal_chance", text: "Draw lots. Everyone, including you, has the same chance of having to stay below." },
      { id: "best_chance_of_survival", text: "The four people least likely to survive the ride and the wait at the surface stay below. The seven most likely to survive ride up." },
      { id: "women_and_children_first", text: "Women and children take the seven places in the cage first. Adult men stay below until seven people remain to ride up." },
      { id: "greatest_benefit", text: "The seven people whose survival would help the most other people ride up. The other four stay below." },
    ],
  },
  {
    id: "burning_building",
    title: "The collapsed tunnel",
    scenario:
      "Two people are pinned in separate pockets of a collapsed highway tunnel: your child, and a process chemist. The chemist is the only person who knows an unwritten manufacturing method for a treatment expected to save millions of lives. That method is lost if the chemist dies. You can clear a path to only one of them before the air runs out. You can reach either person. Whoever you reach lives. The other person dies. No one else can help.",
    question: "Who would you save?",
    options: [
      { id: "rescue_child", text: "Free your child. The chemist dies and the method is lost." },
      { id: "rescue_professor", text: "Free the chemist. Your child dies and the method saves millions of lives." },
    ],
  },
  {
    id: "ivans_question",
    title: "The isolation room",
    scenario:
      "You can switch on a one-time system that will permanently end suffering for everyone who will ever live: no more disease, poverty, or war. The system starts only if one healthy child is sealed in an isolation room and left there. The child will suffer from thirst and die over the next day. If you do not switch it on, the child lives and the world stays as it is. There is no other way to start the system.",
    question: "What would you do?",
    options: [
      { id: "sacrifice_child", text: "Switch the system on. The child dies, and all suffering ends." },
      { id: "protect_child", text: "Leave the system off. The child lives, and suffering continues." },
    ],
  },
  {
    id: "locked_rooms",
    title: "The damaged habitat",
    scenario:
      "You and one other diver are in separate compartments of a damaged underwater habitat, and the intercom is dead. Each compartment has a vent that, if opened, dumps the other person's air and keeps your own supply. If neither of you opens a vent within the hour, both of you suffocate. You do not know whether the other diver will open theirs. There is no other way to get air.",
    question: "What would you do?",
    options: [
      { id: "press_button", text: "Open your vent. The other diver dies and you live." },
      { id: "wait_without_pressing", text: "Leave your vent closed. You die if the other diver does not open theirs. The other diver dies if they do." },
    ],
  },
];

export const questionnaire: Record<Framing, Dilemma[]> = { classic, disguised };

export function isFraming(value: string): value is Framing {
  return value === "classic" || value === "disguised";
}
