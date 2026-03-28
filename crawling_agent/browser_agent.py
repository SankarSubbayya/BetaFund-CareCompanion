import asyncio
from browser_use import Agent
from browser_use.llm import ChatAnthropic


async def main():
    # 1. Initialize Claude Sonnet 4.6
    # The agent uses this as its "brain" to process what it sees and decide what to click.
    llm = ChatAnthropic(
        model="claude-sonnet-4-5",
        temperature=0.0  # Keep temperature at 0 for more consistent, logical tool use
    )

    # 2. Define the Agent and the Task
    links = [
        # "https://www.sutterhealth.org/find-doctor/city/Sunnyvale/dermatologists-1042264308"
        "https://stanfordhealthcare.org/directory/directory.html#x1=sp_prim_care_phy&q1=true&sp_x_2=sp_prim_care_types&sp_q_exact_2=Adults&page=1"
    ]
    s = "\n".join(links)
    prompt = f"""
    Go to website and crawl all information of doctors/nurses in that page, 
    then click the next page on pagination bar (at the bottom) to continue to crawl
    {s}

    Store all information into csv file.
    """
    agent = Agent(
        task=(prompt),
        llm=llm
    )

    print("Starting the browser agent... Watch it go!")

    # 3. Run the automation loop
    # This will open a local Chromium window so you can watch Claude drive.
    result = await agent.run()

    print("\n--- Final Result ---")
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
